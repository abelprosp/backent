import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { ProvisioningService } from './provisioning.service';
import { generateApiKey } from '@backent/shared';
import type { TableDefinition } from '@backent/shared';
import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'Meu App SaaS' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  templateId?: string;
}

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private provisioning: ProvisioningService,
  ) {}

  async findByWorkspace(workspaceId: string, userId: string) {
    await this.ensureWorkspaceAccess(workspaceId, userId);
    return this.prisma.project.findMany({
      where: { workspaceId, status: { not: 'DELETED' } },
      include: {
        _count: { select: { tables: true, apiKeys: true } },
        serverNode: { select: { name: true, region: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        workspace: { include: { plan: true } },
        tables: true,
        apiKeys: { where: { revoked: false } },
        serverNode: true,
      },
    });

    if (!project) throw new NotFoundException('Projeto não encontrado');
    await this.ensureWorkspaceAccess(project.workspaceId, userId);
    return project;
  }

  async create(workspaceId: string, userId: string, dto: CreateProjectDto) {
    const workspace = await this.ensureWorkspaceAccess(workspaceId, userId);

    const projectCount = await this.prisma.project.count({
      where: { workspaceId, status: { not: 'DELETED' } },
    });

    if (projectCount >= workspace.plan.maxProjects) {
      throw new BadRequestException('Limite de projetos atingido para seu plano');
    }

    const serverNode = await this.provisioning.selectBestServerNode();
    if (!serverNode) {
      throw new BadRequestException('Nenhum servidor disponível');
    }

    const slug = this.provisioning.buildProjectSlug(dto.name);
    const schemaName = this.provisioning.buildSchemaName(workspace.slug, slug);
    const jwtSecret = randomBytes(32).toString('hex');

    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        workspaceId,
        serverNodeId: serverNode.id,
        schemaName,
        jwtSecret,
        status: 'PROVISIONING',
      },
    });

    await this.provisioning.provisionProject(project.id);

    if (dto.templateId) {
      const template = await this.prisma.projectTemplate.findUnique({
        where: { id: dto.templateId },
      });
      if (template?.schema) {
        const schema = template.schema as unknown as { tables: TableDefinition[] };
        for (const table of schema.tables ?? []) {
          await this.provisioning.createTableInSchema(project.schemaName, table);
          await this.prisma.projectTable.create({
            data: {
              projectId: project.id,
              name: table.name,
              displayName: table.displayName,
              columns: table.columns as object,
              indexes: (table.indexes ?? []) as object,
              constraints: (table.constraints ?? []) as object,
            },
          });
        }
      }
    }

    const { key, prefix, hash } = generateApiKey();
    await this.prisma.apiKey.create({
      data: {
        projectId: project.id,
        name: 'Default API Key',
        keyHash: hash,
        keyPrefix: prefix,
      },
    });

    return {
      project: await this.findOne(project.id, userId),
      apiKey: key,
    };
  }

  async createApiKey(projectId: string, userId: string, name: string) {
    const project = await this.findOne(projectId, userId);
    const { key, prefix, hash } = generateApiKey();

    await this.prisma.apiKey.create({
      data: {
        projectId: project.id,
        name,
        keyHash: hash,
        keyPrefix: prefix,
      },
    });

    return { key, prefix };
  }

  async delete(projectId: string, userId: string) {
    await this.findOne(projectId, userId);
    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'DELETED' },
    });
    return { success: true };
  }

  private async ensureWorkspaceAccess(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      include: { workspace: { include: { plan: true } } },
    });

    if (!member) throw new ForbiddenException('Acesso negado ao workspace');
    return member.workspace;
  }
}
