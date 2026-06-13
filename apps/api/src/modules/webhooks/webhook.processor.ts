import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { WebhooksService } from './webhooks.service';

@Processor('webhooks')
export class WebhookProcessor extends WorkerHost {
  constructor(private webhooksService: WebhooksService) {
    super();
  }

  async process(job: Job) {
    if (job.name === 'deliver') {
      await this.webhooksService.deliverWebhook(job.data);
    }
  }
}
