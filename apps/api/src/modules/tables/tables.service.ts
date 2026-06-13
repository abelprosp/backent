import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ProvisioningService } from '../projects/provisioning.service';
import type { TableDefinition, ColumnDefinition } from '@backent/shared';
import {
  assertAllowedColumns,
  assertAllowedOrderColumn,
  assertOrderDirection,
  assertSqlIdentifier,
  assertSqlSchemaName,
  qualifiedTable,
} from '@/common/security/sql.util';

@Injectable()
export class TablesService {
  constructor(
    private prisma: PrismaService,
    private provisioning: ProvisioningService,
  ) {}

  async findAll(projectId: string) {
    return this.prisma.projectTable.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(projectId: string, table: TableDefinition) {
    const project = await this.getActiveProject(projectId);
    assertSqlIdentifier(table.name, 'tabela');

    const existing = await this.prisma.projectTable.findUnique({
      where: { projectId_name: { projectId, name: table.name } },
    });

    if (existing) {
      throw new BadRequestException('Tabela já existe');
    }

    await this.provisioning.createTableInSchema(project.schemaName, table);

    return this.prisma.projectTable.create({
      data: {
        projectId,
        name: table.name,
        displayName: table.displayName,
        columns: table.columns as object,
        indexes: (table.indexes ?? []) as object,
        constraints: (table.constraints ?? []) as object,
      },
    });
  }

  async update(projectId: string, tableName: string, columns: ColumnDefinition[]) {
    await this.getTableMeta(projectId, tableName);

    return this.prisma.projectTable.update({
      where: { projectId_name: { projectId, name: tableName } },
      data: { columns: columns as object },
    });
  }

  async delete(projectId: string, tableName: string) {
    const project = await this.getActiveProject(projectId);
    assertSqlIdentifier(tableName, 'tabela');
    await this.provisioning.dropTableFromSchema(project.schemaName, tableName);

    await this.prisma.projectTable.delete({
      where: { projectId_name: { projectId, name: tableName } },
    });

    return { success: true };
  }

  async getRows(
    projectId: string,
    tableName: string,
    page = 1,
    limit = 50,
    orderBy = 'created_at',
    order: 'asc' | 'desc' = 'desc',
  ) {
    const project = await this.getActiveProject(projectId);
    const meta = await this.getTableMeta(projectId, tableName);
    await this.ensurePhysicalTable(project.schemaName, meta);
    const allowed = this.getAllowedColumns(meta);
    const safeOrderBy = assertAllowedOrderColumn(orderBy, allowed);
    const safeOrder = assertOrderDirection(order);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const safePage = Math.max(1, page);
    const offset = (safePage - 1) * safeLimit;
    const qTable = qualifiedTable(project.schemaName, tableName);

    const countResult = await this.prisma.executeTenantQuery<{ count: bigint }[]>(
      `SELECT COUNT(*) as count FROM ${qTable}`,
    );

    const rows = await this.prisma.executeTenantQuery<Record<string, unknown>[]>(
      `SELECT * FROM ${qTable} ORDER BY ${assertSqlIdentifier(safeOrderBy, 'coluna')} ${safeOrder} LIMIT $1 OFFSET $2`,
      [safeLimit, offset],
    );

    const total = Number(countResult[0]?.count ?? 0);

    return {
      data: rows,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async insertRow(projectId: string, tableName: string, data: Record<string, unknown>) {
    const project = await this.getActiveProject(projectId);
    const meta = await this.getTableMeta(projectId, tableName);
    await this.ensurePhysicalTable(project.schemaName, meta);
    const allowed = this.getAllowedColumns(meta);
    const safeData = assertAllowedColumns(data, allowed);
    const keys = Object.keys(safeData);
    if (keys.length === 0) throw new BadRequestException('Nenhum dado válido');

    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.map((k) => assertSqlIdentifier(k, 'coluna')).map((k) => `"${k}"`).join(', ');
    const qTable = qualifiedTable(project.schemaName, tableName);

    await this.prisma.executeTenantCommand(
      `INSERT INTO ${qTable} (${columns}) VALUES (${placeholders})`,
      Object.values(safeData),
    );

    return { success: true };
  }

  async updateRow(
    projectId: string,
    tableName: string,
    id: string,
    data: Record<string, unknown>,
  ) {
    const project = await this.getActiveProject(projectId);
    const meta = await this.getTableMeta(projectId, tableName);
    await this.ensurePhysicalTable(project.schemaName, meta);
    const allowed = this.getAllowedColumns(meta);
    const safeData = assertAllowedColumns(data, allowed);
    const keys = Object.keys(safeData);
    if (keys.length === 0) throw new BadRequestException('Nenhum dado válido');

    const sets = keys
      .map((k, i) => `"${assertSqlIdentifier(k, 'coluna')}" = $${i + 2}`)
      .join(', ');
    const qTable = qualifiedTable(project.schemaName, tableName);

    await this.prisma.executeTenantCommand(
      `UPDATE ${qTable} SET ${sets}, updated_at = NOW() WHERE id = $1::uuid`,
      [id, ...Object.values(safeData)],
    );

    return { success: true };
  }

  async deleteRow(projectId: string, tableName: string, id: string) {
    const project = await this.getActiveProject(projectId);
    const meta = await this.getTableMeta(projectId, tableName);
    await this.ensurePhysicalTable(project.schemaName, meta);
    const qTable = qualifiedTable(project.schemaName, tableName);

    await this.prisma.executeTenantCommand(
      `DELETE FROM ${qTable} WHERE id = $1::uuid`,
      [id],
    );
    return { success: true };
  }

  private async ensurePhysicalTable(
    schemaName: string,
    meta: {
      name: string;
      displayName?: string | null;
      columns: unknown;
      indexes?: unknown;
      constraints?: unknown;
    },
  ) {
    const safeSchema = assertSqlSchemaName(schemaName);
    const safeTable = assertSqlIdentifier(meta.name, 'tabela');

    const result = await this.prisma.$queryRawUnsafe<{ exists: boolean }[]>(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = $1 AND table_name = $2
      ) AS "exists"`,
      safeSchema,
      safeTable,
    );

    if (result[0]?.exists) return;

    await this.provisioning.createTableInSchema(schemaName, {
      name: meta.name,
      displayName: meta.displayName ?? undefined,
      columns: meta.columns as ColumnDefinition[],
      indexes: (meta.indexes ?? []) as TableDefinition['indexes'],
      constraints: (meta.constraints ?? []) as TableDefinition['constraints'],
    });
  }

  private getAllowedColumns(meta: { columns: unknown }): Set<string> {
    const cols = meta.columns as ColumnDefinition[];
    const allowed = new Set<string>(['id', 'created_at', 'updated_at']);
    for (const col of cols ?? []) {
      if (col.name) allowed.add(col.name);
    }
    return allowed;
  }

  private async getTableMeta(projectId: string, tableName: string) {
    assertSqlIdentifier(tableName, 'tabela');
    const table = await this.prisma.projectTable.findUnique({
      where: { projectId_name: { projectId, name: tableName } },
    });
    if (!table) throw new NotFoundException('Tabela não encontrada');
    return table;
  }

  private async getActiveProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException('Projeto não encontrado');
    if (project.status !== 'ACTIVE') {
      throw new BadRequestException('Projeto não está ativo');
    }
    return project;
  }
}
