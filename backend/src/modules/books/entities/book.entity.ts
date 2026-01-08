import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Word } from './word.entity';
import { UserBook } from './user-book.entity';

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index('idx_book_code', { unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'total_words', type: 'int' })
  totalWords: number;

  @Column({ name: 'total_units', type: 'int' })
  totalUnits: number;

  @Column({ name: 'is_free', type: 'boolean', default: false })
  isFree: boolean;

  @Column({ name: 'cover_image', type: 'varchar', length: 500, nullable: true })
  coverImage: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  @Index('idx_book_sort')
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @OneToMany(() => Word, (word) => word.book)
  words: Word[];

  @OneToMany(() => UserBook, (userBook) => userBook.book)
  userBooks: UserBook[];
}
