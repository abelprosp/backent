import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@/prisma/prisma.service';
import {
  createRefreshTokenValue,
  hashRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from './auth-cookies.util';
import type {
  RegisterDto,
  LoginDto,
  MagicLinkDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { generateSecureToken, hashToken } from '@/common/security/crypto.util';

/** Hash fixo para equalizar tempo de resposta quando o usuário não existe. */
const DUMMY_PASSWORD_HASH =
  '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto, res?: Response) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new UnauthorizedException('Email já cadastrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const freePlan = await this.prisma.plan.findFirst({
      where: { tier: 'FREE' },
    });

    if (!freePlan) {
      throw new UnauthorizedException('Plano free não configurado');
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
      },
    });

    const slug = dto.email.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase();

    await this.prisma.workspace.create({
      data: {
        name: `${dto.name ?? 'Meu'} Workspace`,
        slug: `${slug}-${Date.now().toString(36)}`,
        ownerId: user.id,
        planId: freePlan.id,
        members: {
          create: { userId: user.id, role: 'owner' },
        },
      },
    });

    return this.generateTokens(user.id, user.email, user.role, res);
  }

  async login(dto: LoginDto, res?: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    const hash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
    const valid = await bcrypt.compare(dto.password, hash);

    if (!user?.passwordHash || !valid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        resource: 'user',
        resourceId: user.id,
      },
    });

    return this.generateTokens(user.id, user.email, user.role, res);
  }

  async refresh(refreshToken: string, res?: Response) {
    const tokenHash = hashRefreshToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    return this.generateTokens(
      stored.user.id,
      stored.user.email,
      stored.user.role,
      res,
    );
  }

  async logout(refreshToken: string, res?: Response) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { token: hashRefreshToken(refreshToken) },
        data: { revoked: true },
      });
    }
    if (res) clearAuthCookies(res);
    return { success: true };
  }

  async requestMagicLink(dto: MagicLinkDto) {
    const token = generateSecureToken(32);
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    await this.prisma.magicLink.create({
      data: {
        token: tokenHash,
        email: dto.email,
        userId: user?.id,
        expiresAt,
      },
    });

    // TODO: Send email via SMTP (usar `token` em texto plano no link)
    return {
      success: true,
      message: 'Magic link enviado',
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return { success: true, message: 'Se o email existir, enviaremos instruções' };
    }

    const token = generateSecureToken(32);
    await this.prisma.passwordReset.create({
      data: {
        token: hashToken(token),
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    return {
      success: true,
      message: 'Se o email existir, enviaremos instruções',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const reset = await this.prisma.passwordReset.findUnique({
      where: { token: hashToken(dto.token) },
    });

    if (!reset || reset.used || reset.expiresAt < new Date()) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordReset.update({
        where: { id: reset.id },
        data: { used: true },
      }),
    ]);

    return { success: true };
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    res?: Response,
  ) {
    const accessToken = this.jwt.sign(
      { sub: userId, email, role, type: 'access' },
      {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRES_IN') ?? '15m',
      },
    );

    const refreshTokenValue = createRefreshTokenValue();
    const refreshHash = hashRefreshToken(refreshTokenValue);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshHash,
        userId,
        expiresAt,
      },
    });

    if (res) {
      setAuthCookies(res, accessToken, refreshTokenValue);
    }

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn: this.config.get('JWT_EXPIRES_IN') ?? '15m',
    };
  }
}
