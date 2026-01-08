import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Card } from './card.entity';
import { User } from '../../users/entities/user.entity';

export enum ReviewType {
  LEARNING = 'learning',
  REVIEW = 'review',
  RELEARNING = 'relearning',
}

@Entity('revlogs')
@Index('idx_revlog_card', ['cardId'])
@Index('idx_revlog_user_date', ['userId', 'createdAt'])
export class Revlog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'card_id', type: 'uuid' })
  cardId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'int' })
  rating: number; // 0-4 FSRS rating

  @Column({ name: 'response_time_ms', type: 'int' })
  responseTimeMs: number;

  @Column({ name: 'stability_before', type: 'decimal', precision: 10, scale: 4 })
  stabilityBefore: number;

  @Column({ name: 'stability_after', type: 'decimal', precision: 10, scale: 4 })
  stabilityAfter: number;

  @Column({ name: 'difficulty_before', type: 'decimal', precision: 10, scale: 4 })
  difficultyBefore: number;

  @Column({ name: 'difficulty_after', type: 'decimal', precision: 10, scale: 4 })
  difficultyAfter: number;

  @Column({ name: 'interval_before', type: 'int' })
  intervalBefore: number; // days

  @Column({ name: 'interval_after', type: 'int' })
  intervalAfter: number; // days

  @Column({
    name: 'review_type',
    type: 'enum',
    enum: ReviewType,
  })
  reviewType: ReviewType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Card, (card) => card.revlogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'card_id' })
  card: Card;

  @ManyToOne(() => User, (user) => user.revlogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
