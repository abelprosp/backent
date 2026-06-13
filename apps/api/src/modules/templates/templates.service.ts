import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ProvisioningService } from '../projects/provisioning.service';
import { AccessControlService } from '@/common/services/access-control.service';

@Injectable()
export class TemplatesService {
  constructor(
    private prisma: PrismaService,
    private provisioning: ProvisioningService,
    private access: AccessControlService,
  ) {}

  async findAll(category?: string) {
    return this.prisma.projectTemplate.findMany({
      where: {
        isPublic: true,
        ...(category && { category }),
      },
      orderBy: { downloads: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.projectTemplate.findUnique({ where: { id } });
  }

  async applyTemplate(projectId: string, templateId: string, userId: string) {
    await this.access.ensureProjectAccess(projectId, userId);

    const [project, template] = await Promise.all([
      this.prisma.project.findUnique({ where: { id: projectId } }),
      this.prisma.projectTemplate.findUnique({ where: { id: templateId } }),
    ]);

    if (!project || !template) throw new NotFoundException('Projeto ou template não encontrado');

    const schema = template.schema as { tables: Array<{ name: string; columns: unknown }> };

    for (const table of schema.tables ?? []) {
      await this.provisioning.createTableInSchema(
        project.schemaName,
        table as Parameters<ProvisioningService['createTableInSchema']>[1],
      );

      const existing = await this.prisma.projectTable.findUnique({
        where: { projectId_name: { projectId, name: table.name } },
      });
      if (!existing) {
        await this.prisma.projectTable.create({
          data: {
            projectId,
            name: table.name,
            columns: table.columns as object,
          },
        });
      }
    }

    await this.prisma.projectTemplate.update({
      where: { id: templateId },
      data: { downloads: { increment: 1 } },
    });

    return { success: true, tablesCreated: schema.tables?.length ?? 0 };
  }
}
