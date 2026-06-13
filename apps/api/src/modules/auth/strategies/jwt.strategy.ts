import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '@/prisma/prisma.service';
import { getRequiredSecret } from '@/common/security/crypto.util';
import type { JwtPayload } from '@backent/shared';

function extractJwt(req: Request): string | null {
  const bearer = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  if (bearer) return bearer;
  const cookie = req.cookies?.access_token;
  return cookie ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    const secret =
      process.env.NODE_ENV === 'production'
        ? getRequiredSecret(config.get('JWT_SECRET'), 'JWT_SECRET')
        : config.get<string>('JWT_SECRET') ?? 'dev-only-jwt-secret-min-32-chars!!';

    super({
      jwtFromRequest: extractJwt,
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Token inválido');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
