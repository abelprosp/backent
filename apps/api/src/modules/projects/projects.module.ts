import { Module } from '@nestjs/common';
import {
  ProjectsController,
  ProjectDetailController,
} from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProvisioningService } from './provisioning.service';

@Module({
  controllers: [ProjectsController, ProjectDetailController],
  providers: [ProjectsService, ProvisioningService],
  exports: [ProjectsService, ProvisioningService],
})
export class ProjectsModule {}
