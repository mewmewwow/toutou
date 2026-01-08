import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Book } from '../../books/entities/book.entity';

export enum SessionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export interface ReinforcementWord {
  wordId: string;
  word: string;
  definition: string;
  attempts: number;
}

@Entity('learning_sessions')
@Index('idx_session_user_active', ['userId'], { where: "status = 'active'" })
export class LearningSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'book_id', type: 'uuid' })
  bookId: string;

  @Column({ name: 'unit_number', type: 'int' })
  unitNumber: number;

  @Column({ name: 'module_type', type: 'int' })
  moduleType: number;

  @Column({ name: 'words_completed', type: 'int', default: 0 })
  wordsCompleted: number;

  @Column({ name: 'words_total', type: 'int' })
  wordsTotal: number;

  @Column({ name: 'is_reinforcement', type: 'boolean', default: false })
  isReinforcement: boolean;

  @Column({ name: 'reinforcement_words', type: 'jsonb', nullable: true })
  reinforcementWords: ReinforcementWord[] | null;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.ACTIVE,
  })
  status: SessionStatus;

  @Column({ name: 'effective_seconds', type: 'int', default: 0 })
  effectiveSeconds: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.learningSessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Book, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'book_id' })
  book: Book;

  // Helper methods
  isActive(): boolean {
    return this.status === SessionStatus.ACTIVE;
  }

  isCompleted(): boolean {
    return this.status === SessionStatus.COMPLETED;
  }

  getProgress(): number {
    if (this.wordsTotal === 0) return 0;
    return Math.round((this.wordsCompleted / this.wordsTotal) * 100);
  }

  getCurrentBatch(): number {
    return Math.floor(this.wordsCompleted / 10) + 1;
  }
}
