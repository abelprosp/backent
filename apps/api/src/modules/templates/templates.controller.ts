import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '@/common/guards/auth.guard';
import { ProjectAccessGuard } from '@/common/guards/access.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Templates')
@Controller('templates')
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  @Get()
  findAll(@Query('category') category?: string) {
    return this.templatesService.findAll(category);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Post(':id/apply/:projectId')
  @UseGuards(JwtAuthGuard, ProjectAccessGuard)
  @ApiBearerAuth()
  apply(
    @Param('id') id: string,
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.templatesService.applyTemplate(projectId, id, userId);
  }
}
