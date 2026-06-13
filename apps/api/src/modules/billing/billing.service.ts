import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AccessControlService } from '@/common/services/access-control.service';

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private access: AccessControlService,
  ) {}

  async getPlans() {
    return this.prisma.plan.findMany({
      where: { active: true },
      orderBy: { priceMonthly: 'asc' },
    });
  }

  async getSubscription(workspaceId: string, userId: string) {
    await this.access.ensureWorkspaceAccess(workspaceId, userId);
    return this.prisma.subscription.findUnique({
      where: { workspaceId },
      include: { plan: true },
    });
  }

  async createCheckoutSession(
    workspaceId: string,
    planTier: string,
    userId: string,
  ) {
    await this.access.ensureWorkspaceAccess(workspaceId, userId);

    const plan = await this.prisma.plan.findFirst({
      where: { tier: planTier as 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE' },
    });

    if (!plan) throw new Error('Plano não encontrado');

    return {
      checkoutUrl: null,
      message: 'Integração Stripe/Mercado Pago — configure STRIPE_SECRET_KEY',
      plan,
      workspaceId,
    };
  }

  async checkLimits(workspaceId: string, userId: string) {
    const workspace = await this.access.ensureWorkspaceAccess(workspaceId, userId);
    const usage = await this.getWorkspaceUsage(workspaceId);

    return {
      plan: workspace.plan,
      usage,
      limits: {
        storageGb: workspace.plan.storageGb,
        apiRequests: workspace.plan.apiRequests,
        maxProjects: workspace.plan.maxProjects,
        maxTables: workspace.plan.maxTables,
      },
      withinLimits: {
        storage: usage.storageBytes < workspace.plan.storageGb * 1024 ** 3,
        apiRequests: usage.apiRequests < workspace.plan.apiRequests,
      },
    };
  }

  private async getWorkspaceUsage(workspaceId: string) {
    const projects = await this.prisma.project.findMany({
      where: { workspaceId },
      include: { usageMetrics: { orderBy: { date: 'desc' }, take: 1 } },
    });

    return projects.reduce(
      (acc, p) => {
        const m = p.usageMetrics[0];
        if (m) {
          acc.apiRequests += m.apiRequests;
          acc.storageBytes += Number(m.storageBytes);
        }
        return acc;
      },
      { apiRequests: 0, storageBytes: 0 },
    );
  }
}
