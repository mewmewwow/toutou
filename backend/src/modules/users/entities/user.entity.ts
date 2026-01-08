import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Device } from '../../devices/entities/device.entity';
import { Card } from '../../fsrs/entities/card.entity';
import { Revlog } from '../../fsrs/entities/revlog.entity';
import { LearningSession } from '../../learning/entities/learning-session.entity';
import { TestAttempt } from '../../tests/entities/test-attempt.entity';
import { CoinTransaction } from '../../rewards/entities/coin-transaction.entity';
import { UserBook } from '../../books/entities/user-book.entity';

export enum MemberType {
  GUEST = 'guest',
  FREE = 'free',
  TRIAL = 'trial',
  PAID = 'paid',
}

export enum PronunciationType {
  US = 'us',
  UK = 'uk',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  @Index('idx_user_email', { unique: true, where: 'email IS NOT NULL' })
  email: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, unique: true })
  @Index('idx_user_phone', { unique: true, where: 'phone IS NOT NULL' })
  phone: string | null;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true })
  passwordHash: string | null;

  @Column({ type: 'varchar', length: 50 })
  username: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar: string | null;

  @Column({ type: 'date', nullable: true })
  birthday: Date | null;

  @Column({ name: 'total_coins', type: 'int', default: 0 })
  totalCoins: number;

  @Column({ name: 'total_credits', type: 'int', default: 0 })
  totalCredits: number;

  @Column({ type: 'int', default: 1 })
  level: number;

  @Column({ name: 'current_streak', type: 'int', default: 0 })
  currentStreak: number;

  @Column({ name: 'longest_streak', type: 'int', default: 0 })
  longestStreak: number;

  @Column({ name: 'last_login_date', type: 'timestamp', nullable: true })
  lastLoginDate: Date | null;

  @Column({
    name: 'member_type',
    type: 'enum',
    enum: MemberType,
    default: MemberType.GUEST,
  })
  memberType: MemberType;

  @Column({ name: 'member_expire_at', type: 'timestamp', nullable: true })
  memberExpireAt: Date | null;

  @Column({
    name: 'pronunciation_pref',
    type: 'enum',
    enum: PronunciationType,
    default: PronunciationType.US,
  })
  pronunciationPref: PronunciationType;

  @Column({ name: 'device_fingerprint', type: 'varchar', length: 64, nullable: true })
  @Index('idx_user_fingerprint', { where: 'device_fingerprint IS NOT NULL' })
  deviceFingerprint: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Device, (device) => device.user)
  devices: Device[];

  @OneToMany(() => Card, (card) => card.user)
  cards: Card[];

  @OneToMany(() => Revlog, (revlog) => revlog.user)
  revlogs: Revlog[];

  @OneToMany(() => LearningSession, (session) => session.user)
  learningSessions: LearningSession[];

  @OneToMany(() => TestAttempt, (attempt) => attempt.user)
  testAttempts: TestAttempt[];

  @OneToMany(() => CoinTransaction, (transaction) => transaction.user)
  coinTransactions: CoinTransaction[];

  @OneToMany(() => UserBook, (userBook) => userBook.user)
  userBooks: UserBook[];

  // Helper methods
  isGuest(): boolean {
    return this.memberType === MemberType.GUEST;
  }

  isPaid(): boolean {
    return this.memberType === MemberType.PAID;
  }

  isTrial(): boolean {
    return this.memberType === MemberType.TRIAL;
  }

  hasActiveSubscription(): boolean {
    if (this.memberType === MemberType.PAID || this.memberType === MemberType.TRIAL) {
      return this.memberExpireAt ? this.memberExpireAt > new Date() : false;
    }
    return false;
  }

  getTrialDaysRemaining(): number | null {
    if (this.memberType !== MemberType.TRIAL || !this.memberExpireAt) {
      return null;
    }
    const now = new Date();
    const diff = this.memberExpireAt.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
}
