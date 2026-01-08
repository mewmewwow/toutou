import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Word } from '../../books/entities/word.entity';
import { Revlog } from './revlog.entity';

export enum CardStatus {
  NEW = 'new',
  LEARNING = 'learning',
  REVIEW = 'review',
  GRADUATED = 'graduated',
}

@Entity('cards')
@Index('idx_card_user_due', ['userId', 'dueAt'])
@Index('idx_card_user_module_due', ['userId', 'moduleType', 'dueAt'])
@Index('idx_card_user_word_module', ['userId', 'wordId', 'moduleType'], { unique: true })
export class Card {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'word_id', type: 'uuid' })
  wordId: string;

  @Column({ name: 'module_type', type: 'int' })
  moduleType: number;

  @Column({
    type: 'enum',
    enum: CardStatus,
    default: CardStatus.NEW,
  })
  status: CardStatus;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  stability: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  difficulty: number;

  @Column({ name: 'due_at', type: 'timestamp', nullable: true })
  dueAt: Date | null;

  @Column({ name: 'last_review_at', type: 'timestamp', nullable: true })
  lastReviewAt: Date | null;

  @Column({ name: 'review_count', type: 'int', default: 0 })
  reviewCount: number;

  @Column({ name: 'error_count', type: 'int', default: 0 })
  errorCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.cards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Word, (word) => word.cards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'word_id' })
  word: Word;

  @OneToMany(() => Revlog, (revlog) => revlog.card)
  revlogs: Revlog[];

  // Helper methods
  isNew(): boolean {
    return this.status === CardStatus.NEW;
  }

  isLearning(): boolean {
    return this.status === CardStatus.LEARNING;
  }

  isReview(): boolean {
    return this.status === CardStatus.REVIEW;
  }

  isGraduated(): boolean {
    return this.status === CardStatus.GRADUATED;
  }

  isDue(): boolean {
    if (!this.dueAt) return false;
    return this.dueAt <= new Date();
  }

  isOverdue(): boolean {
    if (!this.dueAt) return false;
    const now = new Date();
    // Overdue if more than 24 hours past due
    return this.dueAt.getTime() < now.getTime() - 24 * 60 * 60 * 1000;
  }
}
