import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey || typeof apiKey !== 'string' || !apiKey.startsWith('bk_')) {
      throw new UnauthorizedException('Header X-API-Key obrigatório');
    }

    const hash = createHash('sha256').update(apiKey).digest('hex');
    const key = await this.prisma.apiKey.findUnique({
      where: { keyHash: hash },
      include: { project: true },
    });

    if (!key || key.revoked || key.project.status !== 'ACTIVE') {
      throw new UnauthorizedException('API Key inválida ou revogada');
    }

    const routeProjectId = request.params?.projectId;
    if (routeProjectId && routeProjectId !== key.project.id) {
      throw new ForbiddenException('API Key não autorizada para este projeto');
    }

    await this.prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    });

    request.project = key.project;
    request.apiKey = key;
    return true;
  }
}
