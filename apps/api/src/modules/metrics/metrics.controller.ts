import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';
import { JwtAuthGuard } from '@/common/guards/auth.guard';
import { ProjectAccessGuard } from '@/common/guards/access.guard';

@ApiTags('Metrics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
@Controller('projects/:projectId/metrics')
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Get()
  getStats(@Param('projectId') projectId: string) {
    return this.metricsService.getDashboardStats(projectId);
  }

  @Get('history')
  getHistory(@Param('projectId') projectId: string) {
    return this.metricsService.getProjectMetrics(projectId);
  }
}
