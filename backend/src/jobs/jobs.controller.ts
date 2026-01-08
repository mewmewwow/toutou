import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { GuestCleanupJob } from './guest-cleanup.job';
import { TrialExpirationJob } from './trial-expiration.job';

/**
 * Admin controller for manual job execution and monitoring
 * In production, these should be protected by admin-only guards
 */
@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(
    private readonly guestCleanupJob: GuestCleanupJob,
    private readonly trialExpirationJob: TrialExpirationJob,
  ) {}

  // ==================== Guest Cleanup ====================

  @Post('guest-cleanup/execute')
  async executeGuestCleanup() {
    const result = await this.guestCleanupJob.execute();
    return {
      success: true,
      result,
      message: `Cleaned up ${result.usersDeleted} guest users and associated data`,
    };
  }

  @Get('guest-cleanup/preview')
  async previewGuestCleanup() {
    const preview = await this.guestCleanupJob.getCleanupPreview();
    return {
      ...preview,
      message: `${preview.inactiveGuestCount} guest users will be deleted (inactive since ${preview.cutoffDate.toISOString()})`,
    };
  }

  @Get('guest-cleanup/retention')
  getGuestCleanupRetention() {
    return {
      retentionDays: this.guestCleanupJob.getRetentionDays(),
      message: `Guest data is retained for ${this.guestCleanupJob.getRetentionDays()} days`,
    };
  }

  // ==================== Trial Expiration ====================

  @Post('trial-expiration/execute')
  async executeTrialExpiration() {
    const result = await this.trialExpirationJob.execute();
    return {
      success: true,
      result,
      message: `Expired ${result.trialsExpired} trial memberships, downgraded ${result.usersDowngraded} users to FREE`,
    };
  }

  @Get('trial-expiration/stats')
  async getTrialStats() {
    const stats = await this.trialExpirationJob.getTrialStats();
    return {
      ...stats,
      message: `${stats.activeTrials} active trials, ${stats.expiredTrials} expired`,
    };
  }

  @Get('trial-expiration/expiring/:days')
  async getExpiringTrials(@Param('days') days: string) {
    const daysThreshold = parseInt(days);
    const expiring = await this.trialExpirationJob.getExpiringTrials(
      daysThreshold,
    );
    return {
      count: expiring.length,
      daysThreshold,
      expiringTrials: expiring,
      message: `${expiring.length} trials expiring in ${daysThreshold} days`,
    };
  }

  @Get('trial-expiration/count/expired')
  async getExpiredTrialCount() {
    const count = await this.trialExpirationJob.getExpiredTrialCount();
    return {
      count,
      message: `${count} expired trials pending cleanup`,
    };
  }

  @Get('trial-expiration/count/active')
  async getActiveTrialCount() {
    const count = await this.trialExpirationJob.getActiveTrialCount();
    return {
      count,
      message: `${count} active trial memberships`,
    };
  }

  @Post('trial-expiration/expire/:userId')
  async expireSpecificTrial(@Param('userId') userId: string) {
    await this.trialExpirationJob.expireTrialUser(userId);
    return {
      success: true,
      userId,
      message: `Trial membership for user ${userId} has been expired`,
    };
  }

  // ==================== Job Status ====================

  @Get('status')
  async getJobStatus() {
    const [guestPreview, trialStats] = await Promise.all([
      this.guestCleanupJob.getCleanupPreview(),
      this.trialExpirationJob.getTrialStats(),
    ]);

    return {
      jobs: [
        {
          name: 'guest-cleanup',
          description: 'Clean up inactive guest users',
          retentionDays: this.guestCleanupJob.getRetentionDays(),
          pendingCleanup: guestPreview.inactiveGuestCount,
          cutoffDate: guestPreview.cutoffDate,
        },
        {
          name: 'trial-expiration',
          description: 'Expire trial memberships',
          activeTrials: trialStats.activeTrials,
          expiredTrials: trialStats.expiredTrials,
          expiringIn3Days: trialStats.expiringIn3Days,
          expiringIn7Days: trialStats.expiringIn7Days,
        },
      ],
      message: 'Job status retrieved successfully',
    };
  }
}
