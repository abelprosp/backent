import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class AccessControlService {
  constructor(private prisma: PrismaService) {}

  async ensureWorkspaceAccess(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      include: { workspace: { include: { plan: true } } },
    });

    if (!member) throw new ForbiddenException('Acesso negado ao workspace');
    return member.workspace;
  }

  async ensureProjectAccess(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { workspace: true },
    });

    if (!project || project.status === 'DELETED') {
      throw new NotFoundException('Projeto não encontrado');
    }

    await this.ensureWorkspaceAccess(project.workspaceId, userId);
    return project;
  }
}
