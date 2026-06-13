import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AccessControlService } from '@/common/services/access-control.service';

@Injectable()
export class ProjectAccessGuard implements CanActivate {
  constructor(private access: AccessControlService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const projectId = request.params?.projectId;

    if (!userId || !projectId) {
      throw new ForbiddenException('Acesso negado');
    }

    const project = await this.access.ensureProjectAccess(projectId, userId);
    request.project = project;
    return true;
  }
}

@Injectable()
export class WorkspaceAccessGuard implements CanActivate {
  constructor(private access: AccessControlService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const workspaceId = request.params?.workspaceId ?? request.params?.id;

    if (!userId || !workspaceId) {
      throw new ForbiddenException('Acesso negado');
    }

    await this.access.ensureWorkspaceAccess(workspaceId, userId);
    return true;
  }
}
