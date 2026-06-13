import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '@/common/guards/auth.guard';
import { WorkspaceAccessGuard } from '@/common/guards/access.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Get('plans')
  getPlans() {
    return this.billingService.getPlans();
  }

  @Get('workspaces/:workspaceId/subscription')
  @UseGuards(JwtAuthGuard, WorkspaceAccessGuard)
  @ApiBearerAuth()
  getSubscription(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.getSubscription(workspaceId, userId);
  }

  @Get('workspaces/:workspaceId/limits')
  @UseGuards(JwtAuthGuard, WorkspaceAccessGuard)
  @ApiBearerAuth()
  checkLimits(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.checkLimits(workspaceId, userId);
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  checkout(
    @Body() body: { workspaceId: string; planTier: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.createCheckoutSession(
      body.workspaceId,
      body.planTier,
      userId,
    );
  }
}
