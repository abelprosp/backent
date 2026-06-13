import { Module } from '@nestjs/common';
import { DynamicApiController } from './dynamic-api.controller';
import { TablesModule } from '../tables/tables.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [TablesModule, WebhooksModule],
  controllers: [DynamicApiController],
})
export class DynamicApiModule {}
