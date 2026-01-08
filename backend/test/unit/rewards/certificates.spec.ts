import { CertificateService } from '../../../src/modules/rewards/certificate.service';
import { Repository } from 'typeorm';
import { Certificate } from '../../../src/modules/rewards/entities/certificate.entity';

describe('CertificateService', () => {
  let service: CertificateService;
  let certificateRepository: jest.Mocked<Repository<Certificate>>;

  beforeEach(() => {
    certificateRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
    } as any;

    service = new CertificateService(certificateRepository);
  });

  describe('awardCertificate', () => {
    it('should award certificate for unit completion', async () => {
      certificateRepository.findOne.mockResolvedValue(null);
      certificateRepository.create.mockReturnValue({
        id: 'cert-123',
        userId: 'user-123',
        bookId: 'book-456',
        unitNumber: 1,
        type: 'unit_completion',
      } as Certificate);
      certificateRepository.save.mockResolvedValue({
        id: 'cert-123',
      } as Certificate);

      const result = await service.awardCertificate({
        userId: 'user-123',
        bookId: 'book-456',
        unitNumber: 1,
        type: 'unit_completion',
        metadata: { wordsLearned: 50, testScore: 85 },
      });

      expect(result.certificateId).toBe('cert-123');
      expect(result.isNewAward).toBe(true);
      expect(certificateRepository.save).toHaveBeenCalled();
    });

    it('should not award duplicate certificate', async () => {
      certificateRepository.findOne.mockResolvedValue({
        id: 'existing-cert',
        userId: 'user-123',
        bookId: 'book-456',
        unitNumber: 1,
        type: 'unit_completion',
      } as Certificate);

      const result = await service.awardCertificate({
        userId: 'user-123',
        bookId: 'book-456',
        unitNumber: 1,
        type: 'unit_completion',
      });

      expect(result.certificateId).toBe('existing-cert');
      expect(result.isNewAward).toBe(false);
      expect(certificateRepository.save).not.toHaveBeenCalled();
    });

    it('should award perfect score certificate', async () => {
      certificateRepository.findOne.mockResolvedValue(null);
      certificateRepository.create.mockReturnValue({
        id: 'cert-perfect',
        type: 'perfect_score',
      } as Certificate);
      certificateRepository.save.mockResolvedValue({
        id: 'cert-perfect',
      } as Certificate);

      const result = await service.awardCertificate({
        userId: 'user-123',
        bookId: 'book-456',
        unitNumber: 1,
        type: 'perfect_score',
        metadata: { testScore: 100, stars: 5 },
      });

      expect(result.certificateId).toBe('cert-perfect');
      expect(result.isNewAward).toBe(true);
    });

    it('should award streak milestone certificate', async () => {
      certificateRepository.findOne.mockResolvedValue(null);
      certificateRepository.create.mockReturnValue({
        id: 'cert-streak',
        type: 'streak_milestone',
      } as Certificate);
      certificateRepository.save.mockResolvedValue({
        id: 'cert-streak',
      } as Certificate);

      const result = await service.awardCertificate({
        userId: 'user-123',
        type: 'streak_milestone',
        metadata: { streakDays: 100 },
      });

      expect(result.certificateId).toBe('cert-streak');
      expect(result.isNewAward).toBe(true);
    });
  });

  describe('getUserCertificates', () => {
    it('should return all certificates for user', async () => {
      const certificates = [
        {
          id: 'cert-1',
          userId: 'user-123',
          type: 'unit_completion',
          awardedAt: new Date('2024-01-01'),
        },
        {
          id: 'cert-2',
          userId: 'user-123',
          type: 'perfect_score',
          awardedAt: new Date('2024-01-15'),
        },
      ] as Certificate[];

      certificateRepository.find.mockResolvedValue(certificates);

      const result = await service.getUserCertificates('user-123');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('cert-2'); // Most recent first
    });

    it('should filter by certificate type', async () => {
      const certificates = [
        {
          id: 'cert-1',
          type: 'unit_completion',
        },
      ] as Certificate[];

      certificateRepository.find.mockResolvedValue(certificates);

      const result = await service.getUserCertificates(
        'user-123',
        'unit_completion',
      );

      expect(result).toHaveLength(1);
      expect(certificateRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-123', type: 'unit_completion' },
        }),
      );
    });
  });

  describe('getCertificate', () => {
    it('should return certificate by id', async () => {
      const certificate = {
        id: 'cert-123',
        userId: 'user-123',
        type: 'unit_completion',
      } as Certificate;

      certificateRepository.findOne.mockResolvedValue(certificate);

      const result = await service.getCertificate('cert-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('cert-123');
    });

    it('should return null for non-existent certificate', async () => {
      certificateRepository.findOne.mockResolvedValue(null);

      const result = await service.getCertificate('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('getCertificateCount', () => {
    it('should return total certificate count', async () => {
      certificateRepository.count.mockResolvedValue(15);

      const count = await service.getCertificateCount('user-123');

      expect(count).toBe(15);
    });

    it('should return count by type', async () => {
      certificateRepository.count.mockResolvedValue(5);

      const count = await service.getCertificateCount(
        'user-123',
        'perfect_score',
      );

      expect(count).toBe(5);
      expect(certificateRepository.count).toHaveBeenCalledWith({
        where: { userId: 'user-123', type: 'perfect_score' },
      });
    });
  });

  describe('getCertificateDisplay', () => {
    it('should return display info for unit completion', () => {
      const display = service.getCertificateDisplay('unit_completion');
      expect(display.title).toBe('单元完成证书');
      expect(display.color).toBe('#4CAF50');
    });

    it('should return display info for perfect score', () => {
      const display = service.getCertificateDisplay('perfect_score');
      expect(display.title).toBe('满分成就');
      expect(display.color).toBe('#FFD700');
    });

    it('should return display info for streak milestone', () => {
      const display = service.getCertificateDisplay('streak_milestone');
      expect(display.title).toBe('连续打卡成就');
      expect(display.color).toBe('#FF6B6B');
    });

    it('should return display info for book completion', () => {
      const display = service.getCertificateDisplay('book_completion');
      expect(display.title).toBe('教材完成证书');
      expect(display.color).toBe('#2196F3');
    });
  });

  describe('hasCertificate', () => {
    it('should return true if certificate exists', async () => {
      certificateRepository.findOne.mockResolvedValue({
        id: 'cert-123',
      } as Certificate);

      const result = await service.hasCertificate({
        userId: 'user-123',
        bookId: 'book-456',
        unitNumber: 1,
        type: 'unit_completion',
      });

      expect(result).toBe(true);
    });

    it('should return false if certificate does not exist', async () => {
      certificateRepository.findOne.mockResolvedValue(null);

      const result = await service.hasCertificate({
        userId: 'user-123',
        bookId: 'book-456',
        unitNumber: 1,
        type: 'unit_completion',
      });

      expect(result).toBe(false);
    });
  });
});
