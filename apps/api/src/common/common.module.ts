import { Global, Module } from '@nestjs/common';
import { AccessControlService } from './services/access-control.service';
import {
  ProjectAccessGuard,
  WorkspaceAccessGuard,
} from './guards/access.guard';

@Global()
@Module({
  providers: [AccessControlService, ProjectAccessGuard, WorkspaceAccessGuard],
  exports: [AccessControlService, ProjectAccessGuard, WorkspaceAccessGuard],
})
export class CommonModule {}
