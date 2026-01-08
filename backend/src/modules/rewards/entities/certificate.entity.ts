import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum CertificateType {
  UNIT_COMPLETION = 'unit_completion',
  PERFECT_SCORE = 'perfect_score',
  STREAK_MILESTONE = 'streak_milestone',
  BOOK_COMPLETION = 'book_completion',
}

@Entity('certificates')
@Index(['userId', 'type'])
@Index(['userId', 'bookId', 'unitNumber', 'type'], { unique: true })
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ name: 'book_id', type: 'uuid', nullable: true })
  bookId: string | null;

  @Column({ name: 'unit_number', type: 'int', nullable: true })
  unitNumber: number | null;

  @Column({
    type: 'enum',
    enum: CertificateType,
  })
  type: CertificateType;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'awarded_at' })
  awardedAt: Date;
}
