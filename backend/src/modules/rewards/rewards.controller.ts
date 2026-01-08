import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoinService } from './coin.service';
import { MedalService } from './medal.service';
import { StreakService } from './streak.service';
import { CertificateService } from './certificate.service';

@Controller('rewards')
@UseGuards(JwtAuthGuard)
export class RewardsController {
  constructor(
    private readonly coinService: CoinService,
    private readonly medalService: MedalService,
    private readonly streakService: StreakService,
    private readonly certificateService: CertificateService,
  ) {}

  // ==================== Coins ====================

  @Get('coins/balance')
  async getCoinBalance(@Request() req: any) {
    const user = req.user;
    const dailyTotal = await this.coinService.getDailyTotal(user.id);
    const remaining = await this.coinService.getRemainingDailyCoins(user.id);
    const dailyCap = this.coinService.getDailyCap();

    return {
      totalCoins: user.totalCoins,
      dailyTotal,
      dailyRemaining: remaining,
      dailyCap,
      hasReachedCap: remaining === 0,
    };
  }

  @Get('coins/transactions')
  async getCoinTransactions(
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    const transactions = await this.coinService.getTransactionHistory(
      req.user.id,
      limit ? parseInt(limit) : 50,
    );

    return {
      transactions,
      total: transactions.length,
    };
  }

  @Get('coins/daily-stats')
  async getDailyStats(@Request() req: any) {
    const dailyTotal = await this.coinService.getDailyTotal(req.user.id);
    const remaining = await this.coinService.getRemainingDailyCoins(req.user.id);
    const hasReachedCap = await this.coinService.hasReachedDailyCap(req.user.id);

    return {
      dailyTotal,
      dailyRemaining: remaining,
      dailyCap: this.coinService.getDailyCap(),
      hasReachedCap,
      earnRates: {
        learning: 5,
        review: 2,
        test: 100,
        daily_login: 10,
        streak: 50,
      },
    };
  }

  // ==================== Medals ====================

  @Get('medals/current')
  async getCurrentMedal(@Request() req: any) {
    const user = req.user;
    const daysActive = this.calculateDaysActive(user.createdAt);
    const medalInfo = this.medalService.getMedalInfo(daysActive);
    const display = this.medalService.getMedalDisplay(medalInfo.tier);
    const progress = this.medalService.getProgressToNextTier(daysActive);

    return {
      ...medalInfo,
      display,
      progressPercentage: progress,
    };
  }

  @Get('medals/thresholds')
  getAllMedalThresholds() {
    const thresholds = this.medalService.getAllThresholds();
    const displays = Object.keys(thresholds).reduce(
      (acc, tier: any) => {
        acc[tier] = this.medalService.getMedalDisplay(tier);
        return acc;
      },
      {} as Record<string, any>,
    );

    return {
      thresholds,
      displays,
    };
  }

  @Get('medals/progress')
  async getMedalProgress(@Request() req: any) {
    const user = req.user;
    const daysActive = this.calculateDaysActive(user.createdAt);
    const progress = this.medalService.getProgressToNextTier(daysActive);
    const medalInfo = this.medalService.getMedalInfo(daysActive);

    return {
      currentTier: medalInfo.tier,
      nextTier: medalInfo.nextTier,
      daysToNextTier: medalInfo.daysToNextTier,
      progressPercentage: progress,
      daysActive,
    };
  }

  // ==================== Streaks ====================

  @Post('streaks/record-login')
  async recordDailyLogin(@Request() req: any) {
    const result = await this.streakService.recordDailyLogin(req.user.id);

    return {
      ...result,
      message: this.getStreakMessage(result),
    };
  }

  @Get('streaks/info')
  async getStreakInfo(@Request() req: any) {
    const info = await this.streakService.getStreakInfo(req.user.id);
    const bonusCoins = this.streakService.getStreakBonus(info.currentStreak);
    const milestones = this.streakService.getMilestones();

    return {
      ...info,
      bonusCoins,
      milestones,
    };
  }

  @Get('streaks/milestones')
  getStreakMilestones() {
    return {
      milestones: this.streakService.getMilestones(),
      bonuses: {
        7: 50,
        30: 100,
        100: 200,
        365: 200,
      },
    };
  }

  // ==================== Certificates ====================

  @Get('certificates')
  async getCertificates(
    @Request() req: any,
    @Query('type') type?: string,
  ) {
    const certificates = await this.certificateService.getUserCertificates(
      req.user.id,
      type,
    );

    const withDisplay = certificates.map((cert) => ({
      ...cert,
      display: this.certificateService.getCertificateDisplay(cert.type),
    }));

    return {
      certificates: withDisplay,
      total: certificates.length,
    };
  }

  @Get('certificates/recent')
  async getRecentCertificates(
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    const certificates = await this.certificateService.getRecentCertificates(
      req.user.id,
      limit ? parseInt(limit) : 10,
    );

    const withDisplay = certificates.map((cert) => ({
      ...cert,
      display: this.certificateService.getCertificateDisplay(cert.type),
    }));

    return {
      certificates: withDisplay,
      total: certificates.length,
    };
  }

  @Get('certificates/count')
  async getCertificateCount(
    @Request() req: any,
    @Query('type') type?: string,
  ) {
    const total = await this.certificateService.getCertificateCount(
      req.user.id,
      type,
    );

    return { total, type: type || 'all' };
  }

  @Get('certificates/:id')
  async getCertificate(@Param('id') id: string) {
    const certificate = await this.certificateService.getCertificate(id);

    if (!certificate) {
      return { error: 'Certificate not found' };
    }

    return {
      certificate,
      display: this.certificateService.getCertificateDisplay(certificate.type),
    };
  }

  @Get('certificates/book/:bookId')
  async getBookCertificates(
    @Request() req: any,
    @Param('bookId') bookId: string,
  ) {
    const certificates = await this.certificateService.getCertificatesByBook(
      req.user.id,
      bookId,
    );

    const withDisplay = certificates.map((cert) => ({
      ...cert,
      display: this.certificateService.getCertificateDisplay(cert.type),
    }));

    return {
      certificates: withDisplay,
      total: certificates.length,
      bookId,
    };
  }

  @Get('certificates/book/:bookId/unit/:unitNumber')
  async getUnitCertificates(
    @Request() req: any,
    @Param('bookId') bookId: string,
    @Param('unitNumber') unitNumber: string,
  ) {
    const certificates = await this.certificateService.getUnitCertificates(
      req.user.id,
      bookId,
      parseInt(unitNumber),
    );

    const withDisplay = certificates.map((cert) => ({
      ...cert,
      display: this.certificateService.getCertificateDisplay(cert.type),
    }));

    return {
      certificates: withDisplay,
      total: certificates.length,
      bookId,
      unitNumber: parseInt(unitNumber),
    };
  }

  // ==================== Dashboard Summary ====================

  @Get('summary')
  async getRewardsSummary(@Request() req: any) {
    const user = req.user;

    // Coins
    const dailyTotal = await this.coinService.getDailyTotal(user.id);
    const remaining = await this.coinService.getRemainingDailyCoins(user.id);

    // Medals
    const daysActive = this.calculateDaysActive(user.createdAt);
    const medalInfo = this.medalService.getMedalInfo(daysActive);
    const medalDisplay = this.medalService.getMedalDisplay(medalInfo.tier);

    // Streaks
    const streakInfo = await this.streakService.getStreakInfo(user.id);

    // Certificates
    const certificateCount = await this.certificateService.getCertificateCount(
      user.id,
    );
    const recentCertificates =
      await this.certificateService.getRecentCertificates(user.id, 3);

    return {
      coins: {
        totalCoins: user.totalCoins,
        dailyTotal,
        dailyRemaining: remaining,
        dailyCap: this.coinService.getDailyCap(),
      },
      medal: {
        ...medalInfo,
        display: medalDisplay,
      },
      streak: streakInfo,
      certificates: {
        total: certificateCount,
        recent: recentCertificates.map((cert) => ({
          ...cert,
          display: this.certificateService.getCertificateDisplay(cert.type),
        })),
      },
    };
  }

  // ==================== Helper Methods ====================

  private calculateDaysActive(createdAt: Date): number {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  private getStreakMessage(result: any): string {
    if (result.alreadyLoggedToday) {
      return '今天已经签到过了！';
    }
    if (result.streakBroken) {
      return `连续打卡已中断，重新开始！之前连续 ${result.previousStreak} 天。`;
    }
    if (result.isMilestone) {
      return `🎉 达成 ${result.currentStreak} 天里程碑！获得 ${result.bonusCoins} 金币奖励！`;
    }
    if (result.isNewRecord) {
      return `🏆 新纪录！连续 ${result.currentStreak} 天打卡！`;
    }
    return `连续打卡 ${result.currentStreak} 天！继续保持！`;
  }
}
