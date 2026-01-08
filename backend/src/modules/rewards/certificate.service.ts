import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate, CertificateType } from './entities/certificate.entity';

export interface AwardCertificateInput {
  userId: string;
  bookId?: string;
  unitNumber?: number;
  type: CertificateType | string;
  metadata?: Record<string, any>;
}

export interface AwardCertificateResult {
  certificateId: string;
  isNewAward: boolean;
  certificate: Certificate;
}

export interface CertificateDisplay {
  title: string;
  description: string;
  color: string;
  icon: string;
}

@Injectable()
export class CertificateService {
  constructor(
    @InjectRepository(Certificate)
    private readonly certificateRepository: Repository<Certificate>,
  ) {}

  /**
   * Award a certificate to a user
   */
  async awardCertificate(
    input: AwardCertificateInput,
  ): Promise<AwardCertificateResult> {
    // Check if certificate already exists
    const existing = await this.certificateRepository.findOne({
      where: {
        userId: input.userId,
        bookId: input.bookId || null,
        unitNumber: input.unitNumber || null,
        type: input.type as CertificateType,
      },
    });

    if (existing) {
      return {
        certificateId: existing.id,
        isNewAward: false,
        certificate: existing,
      };
    }

    // Create new certificate
    const certificate = this.certificateRepository.create({
      userId: input.userId,
      bookId: input.bookId || null,
      unitNumber: input.unitNumber || null,
      type: input.type as CertificateType,
      metadata: input.metadata || null,
    });

    await this.certificateRepository.save(certificate);

    return {
      certificateId: certificate.id,
      isNewAward: true,
      certificate,
    };
  }

  /**
   * Get all certificates for a user
   */
  async getUserCertificates(
    userId: string,
    type?: CertificateType | string,
  ): Promise<Certificate[]> {
    const where: any = { userId };
    if (type) {
      where.type = type;
    }

    return this.certificateRepository.find({
      where,
      order: { awardedAt: 'DESC' },
    });
  }

  /**
   * Get a specific certificate
   */
  async getCertificate(certificateId: string): Promise<Certificate | null> {
    return this.certificateRepository.findOne({
      where: { id: certificateId },
    });
  }

  /**
   * Get certificate count for a user
   */
  async getCertificateCount(
    userId: string,
    type?: CertificateType | string,
  ): Promise<number> {
    const where: any = { userId };
    if (type) {
      where.type = type;
    }

    return this.certificateRepository.count({ where });
  }

  /**
   * Check if user has a specific certificate
   */
  async hasCertificate(criteria: {
    userId: string;
    bookId?: string;
    unitNumber?: number;
    type: CertificateType | string;
  }): Promise<boolean> {
    const certificate = await this.certificateRepository.findOne({
      where: {
        userId: criteria.userId,
        bookId: criteria.bookId || null,
        unitNumber: criteria.unitNumber || null,
        type: criteria.type as CertificateType,
      },
    });

    return !!certificate;
  }

  /**
   * Get display information for a certificate type
   */
  getCertificateDisplay(type: CertificateType | string): CertificateDisplay {
    const displays: Record<string, CertificateDisplay> = {
      unit_completion: {
        title: '单元完成证书',
        description: '完成单元所有学习内容',
        color: '#4CAF50',
        icon: '📜',
      },
      perfect_score: {
        title: '满分成就',
        description: '测试获得满分',
        color: '#FFD700',
        icon: '🏆',
      },
      streak_milestone: {
        title: '连续打卡成就',
        description: '连续登录达成里程碑',
        color: '#FF6B6B',
        icon: '🔥',
      },
      book_completion: {
        title: '教材完成证书',
        description: '完成整本教材学习',
        color: '#2196F3',
        icon: '🎓',
      },
    };

    return (
      displays[type] || {
        title: '成就证书',
        description: '获得特殊成就',
        color: '#9C27B0',
        icon: '⭐',
      }
    );
  }

  /**
   * Get certificates grouped by book
   */
  async getCertificatesByBook(
    userId: string,
    bookId: string,
  ): Promise<Certificate[]> {
    return this.certificateRepository.find({
      where: { userId, bookId },
      order: { unitNumber: 'ASC', awardedAt: 'DESC' },
    });
  }

  /**
   * Get certificates for a specific unit
   */
  async getUnitCertificates(
    userId: string,
    bookId: string,
    unitNumber: number,
  ): Promise<Certificate[]> {
    return this.certificateRepository.find({
      where: { userId, bookId, unitNumber },
      order: { awardedAt: 'DESC' },
    });
  }

  /**
   * Get recently awarded certificates
   */
  async getRecentCertificates(
    userId: string,
    limit: number = 10,
  ): Promise<Certificate[]> {
    return this.certificateRepository.find({
      where: { userId },
      order: { awardedAt: 'DESC' },
      take: limit,
    });
  }
}
