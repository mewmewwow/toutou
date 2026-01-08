import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Word } from '../books/entities/word.entity';

export type QuestionType = 'en_to_cn' | 'cn_to_en';

export interface TestQuestion {
  questionId: string;
  type: QuestionType;
  prompt: string;
  correctAnswer: string;
  options: string[];
  wordId: string;
}

@Injectable()
export class QuestionGeneratorService {
  constructor(
    @InjectRepository(Word)
    private readonly wordRepository: Repository<Word>,
  ) {}

  /**
   * Generate 100 test questions for Recognition test (形→义)
   * 50 questions: en→cn (show English word, select Chinese meaning)
   * 50 questions: cn→en (show Chinese meaning, select English word)
   */
  async generateRecognitionQuestions(
    bookId: string,
    unitNumber: number,
  ): Promise<TestQuestion[]> {
    // Get all words for the unit
    const words = await this.wordRepository.find({
      where: {
        bookId,
        unitNumber,
      },
      relations: ['definitions'],
    });

    if (words.length < 4) {
      throw new Error('Unit must have at least 4 words to generate a test');
    }

    const questions: TestQuestion[] = [];

    // Generate 50 en→cn questions
    const enToCnWords = this.shuffleArray([...words]).slice(0, 50);
    for (const word of enToCnWords) {
      const question = await this.generateEnToCnQuestion(word, words);
      questions.push(question);
    }

    // Generate 50 cn→en questions
    const cnToEnWords = this.shuffleArray([...words]).slice(0, 50);
    for (const word of cnToEnWords) {
      const question = await this.generateCnToEnQuestion(word, words);
      questions.push(question);
    }

    // Shuffle final question order
    return this.shuffleArray(questions);
  }

  /**
   * Generate en→cn question: show English word, select Chinese meaning
   */
  private async generateEnToCnQuestion(
    word: Word,
    allWords: Word[],
  ): Promise<TestQuestion> {
    const correctMeaning = this.getWordMeaning(word);

    // Get 3 wrong options from other words
    const wrongOptions = this.getWrongOptions(
      word,
      allWords,
      3,
      (w) => this.getWordMeaning(w),
    );

    // Combine and shuffle options
    const options = this.shuffleArray([correctMeaning, ...wrongOptions]);

    return {
      questionId: `${word.id}-en-cn`,
      type: 'en_to_cn',
      prompt: word.word,
      correctAnswer: correctMeaning,
      options,
      wordId: word.id,
    };
  }

  /**
   * Generate cn→en question: show Chinese meaning, select English word
   */
  private async generateCnToEnQuestion(
    word: Word,
    allWords: Word[],
  ): Promise<TestQuestion> {
    const correctWord = word.word;
    const meaning = this.getWordMeaning(word);

    // Get 3 wrong options from other words
    const wrongOptions = this.getWrongOptions(
      word,
      allWords,
      3,
      (w) => w.word,
    );

    // Combine and shuffle options
    const options = this.shuffleArray([correctWord, ...wrongOptions]);

    return {
      questionId: `${word.id}-cn-en`,
      type: 'cn_to_en',
      prompt: meaning,
      correctAnswer: correctWord,
      options,
      wordId: word.id,
    };
  }

  /**
   * Get primary meaning for a word (first definition)
   */
  private getWordMeaning(word: Word): string {
    if (!word.definitions || word.definitions.length === 0) {
      return '无定义';
    }

    const def = word.definitions[0];
    return `${def.pos} ${def.meaning}`;
  }

  /**
   * Get wrong options from other words
   */
  private getWrongOptions<T>(
    correctWord: Word,
    allWords: Word[],
    count: number,
    extractor: (word: Word) => T,
  ): T[] {
    const correctValue = extractor(correctWord);

    // Filter out the correct word and shuffle
    const otherWords = allWords.filter((w) => w.id !== correctWord.id);
    const shuffled = this.shuffleArray(otherWords);

    // Get unique wrong options
    const wrongOptions: T[] = [];
    for (const word of shuffled) {
      const value = extractor(word);
      if (value !== correctValue && !wrongOptions.includes(value)) {
        wrongOptions.push(value);
        if (wrongOptions.length >= count) {
          break;
        }
      }
    }

    // If not enough unique options, fill with what we have
    while (wrongOptions.length < count && wrongOptions.length < shuffled.length) {
      const value = extractor(shuffled[wrongOptions.length]);
      if (!wrongOptions.includes(value)) {
        wrongOptions.push(value);
      }
    }

    return wrongOptions;
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Validate answer
   */
  validateAnswer(question: TestQuestion, userAnswer: string): boolean {
    return userAnswer === question.correctAnswer;
  }

  /**
   * Calculate question difficulty based on word properties
   */
  calculateQuestionDifficulty(word: Word): number {
    let difficulty = 5; // Base difficulty

    // Longer words are harder
    if (word.word.length > 10) difficulty += 1;

    // Multiple definitions make it harder
    if (word.definitions && word.definitions.length > 3) difficulty += 1;

    // Cap at 10
    return Math.min(10, difficulty);
  }
}
