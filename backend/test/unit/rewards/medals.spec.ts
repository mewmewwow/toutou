import { MedalService } from '../../../src/modules/rewards/medal.service';

describe('MedalService', () => {
  let service: MedalService;

  beforeEach(() => {
    service = new MedalService();
  });

  describe('calculateMedalTier', () => {
    it('should return Bronze for 7-13 days', () => {
      const tier = service.calculateMedalTier(10);
      expect(tier).toBe('bronze');
    });

    it('should return Silver for 14-29 days', () => {
      const tier = service.calculateMedalTier(20);
      expect(tier).toBe('silver');
    });

    it('should return Gold for 30-59 days', () => {
      const tier = service.calculateMedalTier(45);
      expect(tier).toBe('gold');
    });

    it('should return Platinum for 60-89 days', () => {
      const tier = service.calculateMedalTier(75);
      expect(tier).toBe('platinum');
    });

    it('should return Diamond for 90-179 days', () => {
      const tier = service.calculateMedalTier(120);
      expect(tier).toBe('diamond');
    });

    it('should return Master for 180-364 days', () => {
      const tier = service.calculateMedalTier(250);
      expect(tier).toBe('master');
    });

    it('should return Legend for 365+ days', () => {
      const tier = service.calculateMedalTier(400);
      expect(tier).toBe('legend');
    });

    it('should return none for less than 7 days', () => {
      const tier = service.calculateMedalTier(5);
      expect(tier).toBe('none');
    });
  });

  describe('getNextTierRequirement', () => {
    it('should return requirements for next tier', () => {
      const req = service.getNextTierRequirement('bronze');
      expect(req.nextTier).toBe('silver');
      expect(req.daysRequired).toBe(14);
    });

    it('should return null for legend tier', () => {
      const req = service.getNextTierRequirement('legend');
      expect(req).toBeNull();
    });
  });

  describe('getMedalInfo', () => {
    it('should return complete medal information', () => {
      const info = service.getMedalInfo(45);
      expect(info.tier).toBe('gold');
      expect(info.daysActive).toBe(45);
      expect(info.nextTier).toBe('platinum');
      expect(info.daysToNextTier).toBe(15); // 60 - 45
    });

    it('should handle legend tier correctly', () => {
      const info = service.getMedalInfo(400);
      expect(info.tier).toBe('legend');
      expect(info.nextTier).toBeNull();
      expect(info.daysToNextTier).toBe(0);
    });
  });

  describe('getMedalDisplay', () => {
    it('should return display info for each tier', () => {
      const bronze = service.getMedalDisplay('bronze');
      expect(bronze.name).toBe('青铜勋章');
      expect(bronze.color).toBe('#CD7F32');

      const legend = service.getMedalDisplay('legend');
      expect(legend.name).toBe('传奇勋章');
      expect(legend.color).toBe('#FF00FF');
    });
  });

  describe('getTierPoints', () => {
    it('should return points for each tier', () => {
      expect(service.getTierPoints('bronze')).toBe(10);
      expect(service.getTierPoints('silver')).toBe(20);
      expect(service.getTierPoints('gold')).toBe(50);
      expect(service.getTierPoints('platinum')).toBe(100);
      expect(service.getTierPoints('diamond')).toBe(200);
      expect(service.getTierPoints('master')).toBe(500);
      expect(service.getTierPoints('legend')).toBe(1000);
    });
  });
});
