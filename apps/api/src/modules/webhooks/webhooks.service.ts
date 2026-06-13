import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomBytes } from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';
import type { WebhookEvent } from '@backent/database';
import { assertSafeWebhookUrl } from '@/common/security/url.util';
import { signWebhookPayload } from '@/common/security/crypto.util';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('webhooks') private webhookQueue: Queue,
  ) {}

  async findAll(projectId: string) {
    return this.prisma.webhook.findMany({ where: { projectId } });
  }

  async create(
    projectId: string,
    data: { name: string; url: string; events: WebhookEvent[] },
  ) {
    const safeUrl = assertSafeWebhookUrl(data.url);
    const secret = randomBytes(24).toString('hex');
    return this.prisma.webhook.create({
      data: { projectId, secret, ...data, url: safeUrl },
    });
  }

  async delete(projectId: string, webhookId: string) {
    await this.prisma.webhook.deleteMany({
      where: { id: webhookId, projectId },
    });
    return { success: true };
  }

  async dispatch(
    projectId: string,
    event: string,
    table: string,
    record: Record<string, unknown>,
  ) {
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        projectId,
        active: true,
        events: { has: event as WebhookEvent },
      },
    });

    for (const webhook of webhooks) {
      await this.webhookQueue.add('deliver', {
        webhookId: webhook.id,
        url: webhook.url,
        secret: webhook.secret,
        event,
        payload: {
          event,
          table,
          record,
          timestamp: new Date().toISOString(),
          projectId,
        },
      });
    }
  }

  async deliverWebhook(data: {
    webhookId: string;
    url: string;
    secret: string;
    event: string;
    payload: Record<string, unknown>;
  }) {
    const body = JSON.stringify(data.payload);
    const signature = signWebhookPayload(data.secret, body);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(data.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Backent-Signature': signature,
          'X-Backent-Event': data.event,
          'User-Agent': 'Backent-Webhook/1.0',
        },
        body,
        signal: controller.signal,
        redirect: 'error',
      });

      clearTimeout(timeout);

      await this.prisma.webhookDelivery.create({
        data: {
          webhookId: data.webhookId,
          event: data.event,
          payload: data.payload as object,
          statusCode: response.status,
          response: (await response.text().catch(() => null))?.slice(0, 2000) ?? null,
          success: response.ok,
        },
      });

      await this.prisma.webhook.update({
        where: { id: data.webhookId },
        data: { lastTriggeredAt: new Date() },
      });
    } catch (error) {
      this.logger.error(`Webhook delivery failed: ${data.url}`, error);
      await this.prisma.webhookDelivery.create({
        data: {
          webhookId: data.webhookId,
          event: data.event,
          payload: data.payload as object,
          success: false,
          response: String(error).slice(0, 2000),
        },
      });
    }
  }
}
