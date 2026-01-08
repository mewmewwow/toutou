import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Word } from './entities/word.entity';
import { Sentence } from './entities/sentence.entity';

export interface WordWithSentences {
  id: string;
  word: string;
  phoneticUs: string | null;
  phoneticUk: string | null;
  audioUs: string | null;
  audioUk: string | null;
  definitions: Array<{ pos: string; meaning: string }>;
  sentences: Array<{
    id: string;
    contentEn: string;
    contentCn: string;
    isPrimary: boolean;
    audioUrl: string | null;
  }>;
}

@Injectable()
export class WordsService {
  constructor(
    @InjectRepository(Word)
    private readonly wordRepository: Repository<Word>,
    @InjectRepository(Sentence)
    private readonly sentenceRepository: Repository<Sentence>,
  ) {}

  /**
   * Get all words for a specific unit in a book
   */
  async getWordsByUnit(
    bookId: string,
    unitNumber: number,
  ): Promise<WordWithSentences[]> {
    const words = await this.wordRepository.find({
      where: { bookId, unitNumber },
      order: { sortOrder: 'ASC' },
    });

    if (words.length === 0) {
      // Check if unit exists
      const anyWord = await this.wordRepository.findOne({
        where: { bookId },
      });

      if (!anyWord) {
        throw new NotFoundException({
          code: 'BOOK_NOT_FOUND',
          message: '未找到该词书',
        });
      }

      throw new NotFoundException({
        code: 'UNIT_NOT_FOUND',
        message: `未找到第 ${unitNumber} 单元`,
      });
    }

    // Get all sentences for these words
    const wordIds = words.map((w) => w.id);
    const sentences = await this.sentenceRepository
      .createQueryBuilder('sentence')
      .where('sentence.word_id IN (:...wordIds)', { wordIds })
      .orderBy('sentence.sort_order', 'ASC')
      .getMany();

    // Group sentences by word ID
    const sentencesByWord = new Map<string, Sentence[]>();
    for (const sentence of sentences) {
      const wordSentences = sentencesByWord.get(sentence.wordId) || [];
      wordSentences.push(sentence);
      sentencesByWord.set(sentence.wordId, wordSentences);
    }

    // Build response
    return words.map((word) => ({
      id: word.id,
      word: word.word,
      phoneticUs: word.phoneticUs,
      phoneticUk: word.phoneticUk,
      audioUs: word.audioUs,
      audioUk: word.audioUk,
      definitions: word.definitions,
      sentences: (sentencesByWord.get(word.id) || []).map((s) => ({
        id: s.id,
        contentEn: s.contentEn,
        contentCn: s.contentCn,
        isPrimary: s.isPrimary,
        audioUrl: s.audioUrl,
      })),
    }));
  }

  /**
   * Get word by ID with sentences
   */
  async getWordById(wordId: string): Promise<WordWithSentences | null> {
    const word = await this.wordRepository.findOne({
      where: { id: wordId },
    });

    if (!word) {
      return null;
    }

    const sentences = await this.sentenceRepository.find({
      where: { wordId },
      order: { sortOrder: 'ASC' },
    });

    return {
      id: word.id,
      word: word.word,
      phoneticUs: word.phoneticUs,
      phoneticUk: word.phoneticUk,
      audioUs: word.audioUs,
      audioUk: word.audioUk,
      definitions: word.definitions,
      sentences: sentences.map((s) => ({
        id: s.id,
        contentEn: s.contentEn,
        contentCn: s.contentCn,
        isPrimary: s.isPrimary,
        audioUrl: s.audioUrl,
      })),
    };
  }

  /**
   * Get word count for a unit
   */
  async getUnitWordCount(bookId: string, unitNumber: number): Promise<number> {
    return this.wordRepository.count({
      where: { bookId, unitNumber },
    });
  }

  /**
   * Get words for learning batch (with pagination)
   */
  async getWordsForBatch(
    bookId: string,
    unitNumber: number,
    offset: number,
    limit: number = 10,
  ): Promise<Word[]> {
    return this.wordRepository.find({
      where: { bookId, unitNumber },
      order: { sortOrder: 'ASC' },
      skip: offset,
      take: limit,
    });
  }

  /**
   * Get specific words by IDs
   */
  async getWordsByIds(wordIds: string[]): Promise<WordWithSentences[]> {
    if (wordIds.length === 0) {
      return [];
    }

    const words = await this.wordRepository
      .createQueryBuilder('word')
      .where('word.id IN (:...wordIds)', { wordIds })
      .getMany();

    const sentences = await this.sentenceRepository
      .createQueryBuilder('sentence')
      .where('sentence.word_id IN (:...wordIds)', { wordIds })
      .orderBy('sentence.sort_order', 'ASC')
      .getMany();

    const sentencesByWord = new Map<string, Sentence[]>();
    for (const sentence of sentences) {
      const wordSentences = sentencesByWord.get(sentence.wordId) || [];
      wordSentences.push(sentence);
      sentencesByWord.set(sentence.wordId, wordSentences);
    }

    // Maintain order from input wordIds
    const wordMap = new Map(words.map((w) => [w.id, w]));
    return wordIds
      .map((id) => wordMap.get(id))
      .filter((w): w is Word => w !== undefined)
      .map((word) => ({
        id: word.id,
        word: word.word,
        phoneticUs: word.phoneticUs,
        phoneticUk: word.phoneticUk,
        audioUs: word.audioUs,
        audioUk: word.audioUk,
        definitions: word.definitions,
        sentences: (sentencesByWord.get(word.id) || []).map((s) => ({
          id: s.id,
          contentEn: s.contentEn,
          contentCn: s.contentCn,
          isPrimary: s.isPrimary,
          audioUrl: s.audioUrl,
        })),
      }));
  }
}
