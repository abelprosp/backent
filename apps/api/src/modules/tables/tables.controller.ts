import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TablesService } from './tables.service';
import { JwtAuthGuard } from '@/common/guards/auth.guard';
import { ProjectAccessGuard } from '@/common/guards/access.guard';

@ApiTags('Tables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
@Controller('projects/:projectId/tables')
export class TablesController {
  constructor(private tablesService: TablesService) {}

  @Get()
  findAll(@Param('projectId') projectId: string) {
    return this.tablesService.findAll(projectId);
  }

  @Post()
  create(@Param('projectId') projectId: string, @Body() body: unknown) {
    return this.tablesService.create(projectId, body as Parameters<TablesService['create']>[1]);
  }

  @Get(':tableName/rows')
  getRows(
    @Param('projectId') projectId: string,
    @Param('tableName') tableName: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tablesService.getRows(
      projectId,
      tableName,
      parseInt(page ?? '1', 10),
      parseInt(limit ?? '50', 10),
    );
  }

  @Post(':tableName/rows')
  insertRow(
    @Param('projectId') projectId: string,
    @Param('tableName') tableName: string,
    @Body() data: Record<string, unknown>,
  ) {
    return this.tablesService.insertRow(projectId, tableName, data);
  }

  @Put(':tableName/rows/:id')
  updateRow(
    @Param('projectId') projectId: string,
    @Param('tableName') tableName: string,
    @Param('id') id: string,
    @Body() data: Record<string, unknown>,
  ) {
    return this.tablesService.updateRow(projectId, tableName, id, data);
  }

  @Delete(':tableName/rows/:id')
  deleteRow(
    @Param('projectId') projectId: string,
    @Param('tableName') tableName: string,
    @Param('id') id: string,
  ) {
    return this.tablesService.deleteRow(projectId, tableName, id);
  }

  @Delete(':tableName')
  remove(
    @Param('projectId') projectId: string,
    @Param('tableName') tableName: string,
  ) {
    return this.tablesService.delete(projectId, tableName);
  }
}
