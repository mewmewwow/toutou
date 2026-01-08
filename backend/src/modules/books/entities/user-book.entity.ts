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
import { Book } from './book.entity';

export interface ModuleProgress {
  status: 'not_started' | 'learning' | 'passed';
  stars: number;
  bestScore: number | null;
}

export interface UnitProgress {
  modules: Record<number, ModuleProgress>;
}

@Entity('user_books')
@Index('idx_userbook_user', ['userId'])
@Index('idx_userbook_user_current', ['userId'], { where: 'is_current = true' })
export class UserBook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'book_id', type: 'uuid' })
  bookId: string;

  @Column({ name: 'is_current', type: 'boolean', default: false })
  isCurrent: boolean;

  @Column({ name: 'unit_progress', type: 'jsonb', default: {} })
  unitProgress: Record<number, UnitProgress>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.userBooks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Book, (book) => book.userBooks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'book_id' })
  book: Book;

  // Helper methods
  getUnitProgress(unitNumber: number): UnitProgress | null {
    return this.unitProgress[unitNumber] || null;
  }

  getModuleProgress(unitNumber: number, moduleType: number): ModuleProgress | null {
    const unit = this.unitProgress[unitNumber];
    if (!unit) return null;
    return unit.modules[moduleType] || null;
  }

  updateModuleProgress(unitNumber: number, moduleType: number, progress: ModuleProgress): void {
    if (!this.unitProgress[unitNumber]) {
      this.unitProgress[unitNumber] = { modules: {} };
    }
    this.unitProgress[unitNumber].modules[moduleType] = progress;
  }

  getTotalStars(): number {
    let total = 0;
    for (const unit of Object.values(this.unitProgress)) {
      for (const module of Object.values(unit.modules)) {
        total += module.stars || 0;
      }
    }
    return total;
  }
}
