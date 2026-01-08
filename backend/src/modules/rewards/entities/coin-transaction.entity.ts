import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum CoinTransactionType {
  LEARNING_TIME = 'learning_time',
  TEST_PASS = 'test_pass',
  TEST_SCORE_REFRESH = 'test_score_refresh',
  DAILY_LOGIN = 'daily_login',
  MONTHLY_STREAK = 'monthly_streak',
  BIRTHDAY = 'birthday',
  PK_WIN = 'pk_win',
  PK_LOSS = 'pk_loss',
  REVIEW_LOTTERY = 'review_lottery',
}

@Entity('coin_transactions')
@Index('idx_coin_user_date', ['userId', 'createdAt'])
@Index('idx_coin_user_type_date', ['userId', 'type', 'createdAt'])
export class CoinTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'int' })
  amount: number; // positive = earn, negative = spend

  @Column({ name: 'balance_after', type: 'int' })
  balanceAfter: number;

  @Column({
    type: 'enum',
    enum: CoinTransactionType,
  })
  type: CoinTransactionType;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId: string | null;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.coinTransactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Constants
  static readonly DAILY_LEARNING_CAP = 500;
  static readonly COINS_PER_MINUTE = 1;
  static readonly TEST_PASS_BONUS = {
    RECOGNITION: 10,
    DICTATION: 20,
    WRITING: 20,
    SENTENCE: 30,
  };
}
