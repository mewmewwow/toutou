import { Injectable } from '@nestjs/common';

export type MedalTier =
  | 'none'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'master'
  | 'legend';

export interface MedalInfo {
  tier: MedalTier;
  daysActive: number;
  nextTier: MedalTier | null;
  daysToNextTier: number;
  tierPoints: number;
}

export interface MedalDisplay {
  name: string;
  color: string;
  icon: string;
}

export interface NextTierRequirement {
  nextTier: MedalTier;
  daysRequired: number;
}

@Injectable()
export class MedalService {
  private readonly tierThresholds: Record<MedalTier, number> = {
    none: 0,
    bronze: 7,
    silver: 14,
    gold: 30,
    platinum: 60,
    diamond: 90,
    master: 180,
    legend: 365,
  };

  private readonly tierPoints: Record<MedalTier, number> = {
    none: 0,
    bronze: 10,
    silver: 20,
    gold: 50,
    platinum: 100,
    diamond: 200,
    master: 500,
    legend: 1000,
  };

  private readonly tierOrder: MedalTier[] = [
    'none',
    'bronze',
    'silver',
    'gold',
    'platinum',
    'diamond',
    'master',
    'legend',
  ];

  /**
   * Calculate medal tier based on days active
   */
  calculateMedalTier(daysActive: number): MedalTier {
    let tier: MedalTier = 'none';

    for (const [tierName, threshold] of Object.entries(this.tierThresholds)) {
      if (daysActive >= threshold) {
        tier = tierName as MedalTier;
      } else {
        break;
      }
    }

    return tier;
  }

  /**
   * Get medal information including next tier requirements
   */
  getMedalInfo(daysActive: number): MedalInfo {
    const tier = this.calculateMedalTier(daysActive);
    const nextTierReq = this.getNextTierRequirement(tier);

    return {
      tier,
      daysActive,
      nextTier: nextTierReq?.nextTier || null,
      daysToNextTier: nextTierReq
        ? nextTierReq.daysRequired - daysActive
        : 0,
      tierPoints: this.tierPoints[tier],
    };
  }

  /**
   * Get next tier requirement
   */
  getNextTierRequirement(currentTier: MedalTier): NextTierRequirement | null {
    const currentIndex = this.tierOrder.indexOf(currentTier);
    if (currentIndex === -1 || currentIndex >= this.tierOrder.length - 1) {
      return null; // Already at max tier
    }

    const nextTier = this.tierOrder[currentIndex + 1];
    return {
      nextTier,
      daysRequired: this.tierThresholds[nextTier],
    };
  }

  /**
   * Get display information for a medal tier
   */
  getMedalDisplay(tier: MedalTier): MedalDisplay {
    const displays: Record<MedalTier, MedalDisplay> = {
      none: {
        name: '无勋章',
        color: '#CCCCCC',
        icon: '⚪',
      },
      bronze: {
        name: '青铜勋章',
        color: '#CD7F32',
        icon: '🥉',
      },
      silver: {
        name: '白银勋章',
        color: '#C0C0C0',
        icon: '🥈',
      },
      gold: {
        name: '黄金勋章',
        color: '#FFD700',
        icon: '🥇',
      },
      platinum: {
        name: '铂金勋章',
        color: '#E5E4E2',
        icon: '💎',
      },
      diamond: {
        name: '钻石勋章',
        color: '#B9F2FF',
        icon: '💠',
      },
      master: {
        name: '大师勋章',
        color: '#9966CC',
        icon: '👑',
      },
      legend: {
        name: '传奇勋章',
        color: '#FF00FF',
        icon: '⭐',
      },
    };

    return displays[tier];
  }

  /**
   * Get points awarded for a tier
   */
  getTierPoints(tier: MedalTier): number {
    return this.tierPoints[tier];
  }

  /**
   * Calculate total medal points from multiple tiers
   */
  calculateTotalPoints(tiers: MedalTier[]): number {
    return tiers.reduce((total, tier) => total + this.tierPoints[tier], 0);
  }

  /**
   * Check if user qualifies for a specific tier
   */
  qualifiesForTier(daysActive: number, tier: MedalTier): boolean {
    return daysActive >= this.tierThresholds[tier];
  }

  /**
   * Get all tier thresholds
   */
  getAllThresholds(): Record<MedalTier, number> {
    return { ...this.tierThresholds };
  }

  /**
   * Get progress percentage to next tier
   */
  getProgressToNextTier(daysActive: number): number {
    const tier = this.calculateMedalTier(daysActive);
    const nextTierReq = this.getNextTierRequirement(tier);

    if (!nextTierReq) {
      return 100; // Already at max
    }

    const currentThreshold = this.tierThresholds[tier];
    const nextThreshold = nextTierReq.daysRequired;
    const range = nextThreshold - currentThreshold;
    const progress = daysActive - currentThreshold;

    return Math.min(100, Math.round((progress / range) * 100));
  }
}
