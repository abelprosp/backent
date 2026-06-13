import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AdminService } from './admin.service';
import { JwtAuthGuard, RolesGuard, Roles } from '@/common/guards/auth.guard';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Throttle({ default: { limit: 30, ttl: 60000 } })
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('users')
  getUsers(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getUsers(
      parseInt(page ?? '1', 10),
      parseInt(limit ?? '20', 10),
    );
  }

  @Post('users/:id/suspend')
  suspendUser(@Param('id') id: string) {
    return this.adminService.suspendUser(id);
  }

  @Post('projects/:id/migrate')
  migrateProject(
    @Param('id') id: string,
    @Body('targetServerId') targetServerId: string,
  ) {
    return this.adminService.migrateProject(id, targetServerId);
  }

  @Get('audit-logs')
  getAuditLogs(@Query('page') page?: string) {
    return this.adminService.getAuditLogs(parseInt(page ?? '1', 10));
  }
}
