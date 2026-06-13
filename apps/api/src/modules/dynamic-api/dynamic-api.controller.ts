import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ApiKeyGuard } from '@/common/guards/api-key.guard';
import { TablesService } from '../tables/tables.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { assertSqlIdentifier } from '@/common/security/sql.util';

@ApiTags('Dynamic API')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Throttle({ default: { limit: 120, ttl: 60000 } })
@Controller('projects/:projectId/data')
export class DynamicApiController {
  constructor(
    private tablesService: TablesService,
    private webhooksService: WebhooksService,
  ) {}

  @Get(':table')
  @ApiOperation({ summary: 'List records (auto-generated REST)' })
  async list(
    @Req() req: { project: { id: string } },
    @Param('table') table: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    assertSqlIdentifier(table, 'tabela');
    return this.tablesService.getRows(
      req.project.id,
      table,
      parseInt(page ?? '1', 10),
      Math.min(parseInt(limit ?? '50', 10), 100),
      sort ?? 'created_at',
      order ?? 'desc',
    );
  }

  @Post(':table')
  @ApiOperation({ summary: 'Create record' })
  async create(
    @Req() req: { project: { id: string } },
    @Param('table') table: string,
    @Body() data: Record<string, unknown>,
  ) {
    assertSqlIdentifier(table, 'tabela');
    const result = await this.tablesService.insertRow(req.project.id, table, data);
    await this.webhooksService.dispatch(req.project.id, 'INSERT', table, data);
    return result;
  }

  @Put(':table/:id')
  @ApiOperation({ summary: 'Update record' })
  async update(
    @Req() req: { project: { id: string } },
    @Param('table') table: string,
    @Param('id') id: string,
    @Body() data: Record<string, unknown>,
  ) {
    assertSqlIdentifier(table, 'tabela');
    const result = await this.tablesService.updateRow(req.project.id, table, id, data);
    await this.webhooksService.dispatch(req.project.id, 'UPDATE', table, { id, ...data });
    return result;
  }

  @Delete(':table/:id')
  @ApiOperation({ summary: 'Delete record' })
  async remove(
    @Req() req: { project: { id: string } },
    @Param('table') table: string,
    @Param('id') id: string,
  ) {
    assertSqlIdentifier(table, 'tabela');
    const result = await this.tablesService.deleteRow(req.project.id, table, id);
    await this.webhooksService.dispatch(req.project.id, 'DELETE', table, { id });
    return result;
  }
}
