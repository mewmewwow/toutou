import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Book } from './book.entity';
import { Sentence } from './sentence.entity';
import { Card } from '../../fsrs/entities/card.entity';

export interface WordDefinition {
  pos: string;
  meaning: string;
}

@Entity('words')
@Index('idx_word_book_unit', ['bookId', 'unitNumber'])
@Index('idx_word_book_unit_sort', ['bookId', 'unitNumber', 'sortOrder'])
export class Word {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'book_id', type: 'uuid' })
  bookId: string;

  @Column({ name: 'unit_number', type: 'int' })
  unitNumber: number;

  @Column({ type: 'varchar', length: 100 })
  word: string;

  @Column({ name: 'phonetic_us', type: 'varchar', length: 100, nullable: true })
  phoneticUs: string | null;

  @Column({ name: 'phonetic_uk', type: 'varchar', length: 100, nullable: true })
  phoneticUk: string | null;

  @Column({ name: 'audio_us', type: 'varchar', length: 500, nullable: true })
  audioUs: string | null;

  @Column({ name: 'audio_uk', type: 'varchar', length: 500, nullable: true })
  audioUk: string | null;

  @Column({ type: 'jsonb' })
  definitions: WordDefinition[];

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Book, (book) => book.words, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'book_id' })
  book: Book;

  @OneToMany(() => Sentence, (sentence) => sentence.word)
  sentences: Sentence[];

  @OneToMany(() => Card, (card) => card.word)
  cards: Card[];

  // Helper to get primary definition
  getPrimaryDefinition(): string {
    return this.definitions.map((d) => `${d.pos} ${d.meaning}`).join('; ');
  }
}
