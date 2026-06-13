import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { JwtAuthGuard } from '@/common/guards/auth.guard';
import { ProjectAccessGuard } from '@/common/guards/access.guard';

@ApiTags('Webhooks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
@Controller('projects/:projectId/webhooks')
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Get()
  findAll(@Param('projectId') projectId: string) {
    return this.webhooksService.findAll(projectId);
  }

  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() body: { name: string; url: string; events: string[] },
  ) {
    return this.webhooksService.create(projectId, body as Parameters<WebhooksService['create']>[1]);
  }

  @Delete(':id')
  remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.webhooksService.delete(projectId, id);
  }
}
