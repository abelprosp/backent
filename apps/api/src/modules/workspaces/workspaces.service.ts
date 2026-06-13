import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  async findByUser(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            plan: true,
            _count: { select: { projects: true, members: true } },
          },
        },
      },
    });
    return memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
    }));
  }

  async findOne(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      include: {
        workspace: {
          include: {
            plan: true,
            members: { include: { user: { select: { id: true, email: true, name: true } } } },
          },
        },
      },
    });

    if (!member) throw new ForbiddenException('Acesso negado');
    return { ...member.workspace, role: member.role };
  }

  async getUsage(workspaceId: string, userId: string) {
    await this.findOne(workspaceId, userId);

    const projects = await this.prisma.project.findMany({
      where: { workspaceId, status: 'ACTIVE' },
      include: {
        usageMetrics: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });

    const totals = projects.reduce(
      (acc, p) => {
        const latest = p.usageMetrics[0];
        if (latest) {
          acc.apiRequests += latest.apiRequests;
          acc.storageBytes += Number(latest.storageBytes);
          acc.bandwidthBytes += Number(latest.bandwidthBytes);
        }
        return acc;
      },
      { apiRequests: 0, storageBytes: 0, bandwidthBytes: 0 },
    );

    return { projects: projects.length, ...totals };
  }
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async updateProfile(userId: string, data: { name?: string; avatarUrl?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, name: true, avatarUrl: true },
    });
  }
}
