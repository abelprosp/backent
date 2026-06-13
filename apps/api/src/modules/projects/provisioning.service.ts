import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { generateSchemaName, slugify } from '@backent/shared';
import type { TableDefinition } from '@backent/shared';
import {
  assertSafeSqlDefault,
  assertSqlIdentifier,
  assertSqlSchemaName,
} from '@/common/security/sql.util';

@Injectable()
export class ProvisioningService {
  private readonly logger = new Logger(ProvisioningService.name);

  constructor(private prisma: PrismaService) {}

  async provisionProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { workspace: true, serverNode: true },
    });

    if (!project) throw new Error('Projeto não encontrado');

    try {
      await this.createTenantSchema(project.schemaName);
      await this.createDefaultTables(project.schemaName);

      const jwtSecret = randomBytes(32).toString('hex');
      const storageBucket = `backent-${project.slug}-${project.id.slice(0, 8)}`;
      const apiUrl = `${process.env.API_URL ?? 'http://localhost:4000'}/api/v1/projects/${project.id}/data`;

      await this.prisma.project.update({
        where: { id: projectId },
        data: {
          status: 'ACTIVE',
          jwtSecret,
          storageBucket,
          apiUrl,
          provisionedAt: new Date(),
        },
      });

      await this.prisma.serverNode.update({
        where: { id: project.serverNodeId },
        data: { currentLoad: { increment: 1 } },
      });

      await this.prisma.auditLog.create({
        data: {
          action: 'PROVISION',
          resource: 'project',
          resourceId: projectId,
          metadata: { schemaName: project.schemaName },
        },
      });

      this.logger.log(`Project ${project.slug} provisioned: ${project.schemaName}`);
      return { success: true, schemaName: project.schemaName, apiUrl };
    } catch (error) {
      this.logger.error(`Provisioning failed for ${projectId}`, error);
      await this.prisma.project.update({
        where: { id: projectId },
        data: { status: 'SUSPENDED' },
      });
      throw error;
    }
  }

  private async createTenantSchema(schemaName: string) {
    const safe = assertSqlSchemaName(schemaName);
    await this.prisma.$executeRawUnsafe(
      `CREATE SCHEMA IF NOT EXISTS "${safe}"`,
    );
  }

  private async createDefaultTables(schemaName: string) {
    const safe = assertSqlSchemaName(schemaName);
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${safe}"."_backent_meta" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR(255) NOT NULL UNIQUE,
        value JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  }

  async createTableInSchema(schemaName: string, table: TableDefinition) {
    const safeSchema = assertSqlSchemaName(schemaName);
    const safeTable = assertSqlIdentifier(table.name, 'tabela');

    const userColumns = table.columns.filter(
      (col) => !['created_at', 'updated_at'].includes(col.name),
    );

    const columns = userColumns.map((col) => {
      assertSqlIdentifier(col.name, 'coluna');
      let def = `"${col.name}" `;
      if (col.type === 'uuid' && col.primaryKey) {
        def += 'UUID PRIMARY KEY DEFAULT gen_random_uuid()';
      } else if (col.type === 'uuid') {
        def += 'UUID';
      } else if (col.type === 'varchar') {
        def += 'VARCHAR(255)';
      } else if (col.type === 'text') {
        def += 'TEXT';
      } else if (col.type === 'integer') {
        def += 'INTEGER';
      } else if (col.type === 'bigint') {
        def += 'BIGINT';
      } else if (col.type === 'decimal') {
        def += 'DECIMAL(10,2)';
      } else if (col.type === 'boolean') {
        def += 'BOOLEAN';
      } else if (col.type === 'date') {
        def += 'DATE';
      } else if (col.type === 'timestamptz') {
        def += 'TIMESTAMPTZ';
      } else if (col.type === 'json' || col.type === 'jsonb') {
        def += 'JSONB';
      } else {
        def += 'TEXT';
      }

      if (col.unique && !col.primaryKey) def += ' UNIQUE';
      if (col.nullable === false && !col.primaryKey) def += ' NOT NULL';
      if (col.default && !col.primaryKey) {
        def += ` DEFAULT ${assertSafeSqlDefault(col.default)}`;
      }

      return def;
    });

    columns.push('"created_at" TIMESTAMPTZ DEFAULT NOW()');
    columns.push('"updated_at" TIMESTAMPTZ DEFAULT NOW()');

    const sql = `CREATE TABLE IF NOT EXISTS "${safeSchema}"."${safeTable}" (${columns.join(', ')})`;
    await this.prisma.$executeRawUnsafe(sql);

    for (const idx of table.indexes ?? []) {
      assertSqlIdentifier(idx.name, 'índice');
      const unique = idx.unique ? 'UNIQUE' : '';
      const cols = idx.columns
        .map((c) => `"${assertSqlIdentifier(c, 'coluna')}"`)
        .join(', ');
      await this.prisma.$executeRawUnsafe(
        `CREATE ${unique} INDEX IF NOT EXISTS "${idx.name}" ON "${safeSchema}"."${safeTable}" (${cols})`,
      );
    }
  }

  async dropTableFromSchema(schemaName: string, tableName: string) {
    const safeSchema = assertSqlSchemaName(schemaName);
    const safeTable = assertSqlIdentifier(tableName, 'tabela');
    await this.prisma.$executeRawUnsafe(
      `DROP TABLE IF EXISTS "${safeSchema}"."${safeTable}" CASCADE`,
    );
  }

  async selectBestServerNode() {
    const nodes = await this.prisma.serverNode.findMany({
      where: { status: 'ONLINE' },
      orderBy: { currentLoad: 'asc' },
    });
    return nodes.find((n) => n.currentLoad < n.capacity) ?? nodes[0] ?? null;
  }

  buildSchemaName(workspaceSlug: string, projectSlug: string): string {
    return generateSchemaName(projectSlug, workspaceSlug);
  }

  buildProjectSlug(name: string): string {
    return slugify(name);
  }
}
