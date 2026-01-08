import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Word } from './word.entity';

@Entity('sentences')
@Index('idx_sentence_word', ['wordId'])
@Index('idx_sentence_word_primary', ['wordId'], { where: 'is_primary = true' })
export class Sentence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'word_id', type: 'uuid' })
  wordId: string;

  @Column({ name: 'content_en', type: 'text' })
  contentEn: string;

  @Column({ name: 'content_cn', type: 'text' })
  contentCn: string;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary: boolean;

  @Column({ name: 'audio_url', type: 'varchar', length: 500, nullable: true })
  audioUrl: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  // Relations
  @ManyToOne(() => Word, (word) => word.sentences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'word_id' })
  word: Word;
}
