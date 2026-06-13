import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  async getProjectMetrics(projectId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return this.prisma.usageMetric.findMany({
      where: { projectId, date: { gte: since } },
      orderBy: { date: 'asc' },
    });
  }

  async recordApiRequest(projectId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.usageMetric.upsert({
      where: {
        projectId_date: { projectId, date: today },
      },
      update: { apiRequests: { increment: 1 } },
      create: { projectId, date: today, apiRequests: 1 },
    });
  }

  async getDashboardStats(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tables: true,
        _count: { select: { apiKeys: true, webhooks: true, storageFiles: true } },
        usageMetrics: { orderBy: { date: 'desc' }, take: 7 },
      },
    });

    if (!project) return null;

    const totalRequests = project.usageMetrics.reduce(
      (a, m) => a + m.apiRequests,
      0,
    );

    return {
      tables: project.tables.length,
      apiKeys: project._count.apiKeys,
      webhooks: project._count.webhooks,
      files: project._count.storageFiles,
      apiRequests7d: totalRequests,
      status: project.status,
      metrics: project.usageMetrics,
    };
  }
}
