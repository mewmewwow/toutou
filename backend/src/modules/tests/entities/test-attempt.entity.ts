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
import { Book } from '../../books/entities/book.entity';

export enum TestMode {
  NORMAL = 'normal',
  SPEED = 'speed',
  ULTIMATE = 'ultimate',
}

@Entity('test_attempts')
@Index('idx_test_user_book_unit_module', ['userId', 'bookId', 'unitNumber', 'moduleType'])
export class TestAttempt {
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

  @Column({
    name: 'test_mode',
    type: 'enum',
    enum: TestMode,
  })
  testMode: TestMode;

  @Column({ type: 'int' })
  score: number; // 0-100

  @Column({ name: 'total_questions', type: 'int' })
  totalQuestions: number;

  @Column({ name: 'correct_answers', type: 'int' })
  correctAnswers: number;

  @Column({ name: 'time_spent_ms', type: 'int' })
  timeSpentMs: number;

  @Column({ type: 'boolean' })
  passed: boolean; // score >= 90

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.testAttempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Book, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'book_id' })
  book: Book;

  // Helper methods
  getAccuracy(): number {
    if (this.totalQuestions === 0) return 0;
    return Math.round((this.correctAnswers / this.totalQuestions) * 100);
  }

  getStarsEarned(): number {
    // 1 star = Normal pass, 2 stars = Speed pass, 3 stars = Ultimate pass
    if (!this.passed) return 0;
    switch (this.testMode) {
      case TestMode.ULTIMATE:
        return 3;
      case TestMode.SPEED:
        return 2;
      case TestMode.NORMAL:
        return 1;
      default:
        return 0;
    }
  }
}
