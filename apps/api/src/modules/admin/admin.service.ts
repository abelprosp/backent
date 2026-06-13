import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const [users, projects, workspaces, servers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.project.count({ where: { status: 'ACTIVE' } }),
      this.prisma.workspace.count(),
      this.prisma.serverNode.findMany(),
    ]);

    return {
      users,
      activeProjects: projects,
      workspaces,
      servers,
      totalCapacity: servers.reduce((a, s) => a + s.capacity, 0),
      totalLoad: servers.reduce((a, s) => a + s.currentLoad, 0),
    };
  }

  async getUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return { data: users, meta: { page, limit, total } };
  }

  async suspendUser(userId: string) {
    // Future: suspend all user workspaces
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'SUSPEND',
        resource: 'user',
        resourceId: userId,
      },
    });
    return { success: true };
  }

  async migrateProject(projectId: string, targetServerId: string) {
    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'MIGRATING', serverNodeId: targetServerId },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'MIGRATE',
        resource: 'project',
        resourceId: projectId,
        metadata: { targetServerId },
      },
    });

    // Background job would handle actual migration
    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'ACTIVE' },
    });

    return project;
  }

  async getAuditLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    return this.prisma.auditLog.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true, name: true } } },
    });
  }
}
