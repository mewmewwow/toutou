import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { LearningModule } from '../../../src/modules/learning/learning.module';
import { DevicesModule } from '../../../src/modules/devices/devices.module';
import { BooksModule } from '../../../src/modules/books/books.module';
import { FsrsModule } from '../../../src/modules/fsrs/fsrs.module';
import { LearningSession } from '../../../src/modules/learning/entities/learning-session.entity';
import { User, MemberType } from '../../../src/modules/users/entities/user.entity';
import { Device } from '../../../src/modules/devices/entities/device.entity';
import { Book } from '../../../src/modules/books/entities/book.entity';
import { Word } from '../../../src/modules/books/entities/word.entity';
import { Sentence } from '../../../src/modules/books/entities/sentence.entity';
import { Card } from '../../../src/modules/fsrs/entities/card.entity';
import { Revlog } from '../../../src/modules/fsrs/entities/revlog.entity';
import { UserBook } from '../../../src/modules/books/entities/user-book.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

/**
 * Integration tests for sentence module submission flow
 * Tests modules 7-10 (sentence-based learning)
 */
describe('Sentence Module Submission (Integration)', () => {
  let app: INestApplication;
  let bookRepository: Repository<Book>;
  let wordRepository: Repository<Word>;
  let sentenceRepository: Repository<Sentence>;
  let userRepository: Repository<User>;
  let sessionRepository: Repository<LearningSession>;

  const guestFingerprint = 'sentence_test_device'.padEnd(64, 'a');
  let testBook: Book;
  let testWord: Word;
  let testSentence: Sentence;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            User, Device, Book, Word, Sentence,
            LearningSession, Card, Revlog, UserBook,
          ],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([
          User, Device, Book, Word, Sentence,
          LearningSession, Card, Revlog, UserBook,
        ]),
        LearningModule,
        DevicesModule,
        BooksModule,
        FsrsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    bookRepository = moduleFixture.get(getRepositoryToken(Book));
    wordRepository = moduleFixture.get(getRepositoryToken(Word));
    sentenceRepository = moduleFixture.get(getRepositoryToken(Sentence));
    userRepository = moduleFixture.get(getRepositoryToken(User));
    sessionRepository = moduleFixture.get(getRepositoryToken(LearningSession));
  });

  beforeEach(async () => {
    // Clear and seed data
    await sessionRepository.delete({});
    await sentenceRepository.delete({});
    await wordRepository.delete({});
    await bookRepository.delete({});
    await userRepository.delete({});

    testBook = await bookRepository.save({
      name: 'Sentence Test Book',
      code: 'SENTENCE',
      description: 'Test book for sentence exercises',
      totalWords: 5,
      totalUnits: 1,
      isFree: false,
      sortOrder: 1,
    });

    testWord = await wordRepository.save({
      bookId: testBook.id,
      unitNumber: 1,
      word: 'abandon',
      phoneticUs: '/əˈbændən/',
      phoneticUk: '/əˈbændən/',
      definitions: [{ pos: 'v.', meaning: 'to leave completely and finally' }],
      sortOrder: 0,
    });

    testSentence = await sentenceRepository.save({
      wordId: testWord.id,
      contentEn: 'The sailors abandoned the sinking ship.',
      contentCn: '水手们弃船逃生。',
      isPrimary: true,
      sortOrder: 0,
    });

    await userRepository.save({
      username: 'Sentence Test User',
      memberType: MemberType.GUEST,
      deviceFingerprint: guestFingerprint,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Module 7: Sentence Listening (例句听组)', () => {
    it('should create session for module type 7', async () => {
      const response = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 7,
        })
        .expect(201);

      expect(response.body.moduleType).toBe(7);
      expect(response.body.status).toBe('active');
    });

    it('should return sentences with audio for listening module', async () => {
      const sessionResponse = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 7,
        });

      const nextResponse = await request(app.getHttpServer())
        .get(`/learning/sessions/${sessionResponse.body.id}/next`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .expect(200);

      expect(nextResponse.body.words).toBeDefined();
      expect(nextResponse.body.words.length).toBeGreaterThan(0);
    });
  });

  describe('Module 8: Sentence Translation (例句翻译)', () => {
    it('should create session for module type 8', async () => {
      const response = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 8,
        })
        .expect(201);

      expect(response.body.moduleType).toBe(8);
    });

    it('should accept word order submission', async () => {
      const sessionResponse = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 8,
        });

      // Get first word
      const nextResponse = await request(app.getHttpServer())
        .get(`/learning/sessions/${sessionResponse.body.id}/next`)
        .set('X-Device-Fingerprint', guestFingerprint);

      const wordId = nextResponse.body.words[0]?.id;
      if (wordId) {
        const submitResponse = await request(app.getHttpServer())
          .post(`/learning/sessions/${sessionResponse.body.id}/submit`)
          .set('X-Device-Fingerprint', guestFingerprint)
          .send({
            wordId,
            rating: 3,
            responseTimeMs: 5000,
            userAnswer: 'The sailors abandoned the sinking ship.',
            isCorrect: true,
          })
          .expect(200);

        expect(submitResponse.body.cardId).toBeDefined();
      }
    });
  });

  describe('Module 9: Sentence Dictation (例句听写)', () => {
    it('should create session for module type 9', async () => {
      const response = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 9,
        })
        .expect(201);

      expect(response.body.moduleType).toBe(9);
    });

    it('should accept typed sentence submission', async () => {
      const sessionResponse = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 9,
        });

      const nextResponse = await request(app.getHttpServer())
        .get(`/learning/sessions/${sessionResponse.body.id}/next`)
        .set('X-Device-Fingerprint', guestFingerprint);

      const wordId = nextResponse.body.words[0]?.id;
      if (wordId) {
        const submitResponse = await request(app.getHttpServer())
          .post(`/learning/sessions/${sessionResponse.body.id}/submit`)
          .set('X-Device-Fingerprint', guestFingerprint)
          .send({
            wordId,
            rating: 3,
            responseTimeMs: 8000,
            userAnswer: 'The sailors abandoned the sinking ship',
            isCorrect: true,
          })
          .expect(200);

        expect(submitResponse.body.newStatus).toBeDefined();
      }
    });
  });

  describe('Module 10: Smart Word Usage (智能用词)', () => {
    it('should create session for module type 10', async () => {
      const response = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 10,
        })
        .expect(201);

      expect(response.body.moduleType).toBe(10);
    });

    it('should accept fill-in-blank submission', async () => {
      const sessionResponse = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 10,
        });

      const nextResponse = await request(app.getHttpServer())
        .get(`/learning/sessions/${sessionResponse.body.id}/next`)
        .set('X-Device-Fingerprint', guestFingerprint);

      const wordId = nextResponse.body.words[0]?.id;
      if (wordId) {
        const submitResponse = await request(app.getHttpServer())
          .post(`/learning/sessions/${sessionResponse.body.id}/submit`)
          .set('X-Device-Fingerprint', guestFingerprint)
          .send({
            wordId,
            rating: 3,
            responseTimeMs: 3000,
            userAnswer: 'abandoned',
            isCorrect: true,
          })
          .expect(200);

        expect(submitResponse.body.stability).toBeDefined();
      }
    });
  });

  describe('Sentence time limit validation', () => {
    it('should accept response within time limit', async () => {
      const sessionResponse = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 8,
        });

      const nextResponse = await request(app.getHttpServer())
        .get(`/learning/sessions/${sessionResponse.body.id}/next`)
        .set('X-Device-Fingerprint', guestFingerprint);

      const wordId = nextResponse.body.words[0]?.id;
      if (wordId) {
        // Sentence has ~40 chars, so ~80 seconds allowed
        await request(app.getHttpServer())
          .post(`/learning/sessions/${sessionResponse.body.id}/submit`)
          .set('X-Device-Fingerprint', guestFingerprint)
          .send({
            wordId,
            rating: 3,
            responseTimeMs: 60000, // 60 seconds
            isCorrect: true,
          })
          .expect(200);
      }
    });
  });

  describe('Session progress for sentence modules', () => {
    it('should track progress across sentence submissions', async () => {
      const sessionResponse = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 8,
        });

      const sessionId = sessionResponse.body.id;

      // Get and submit first word
      const nextResponse = await request(app.getHttpServer())
        .get(`/learning/sessions/${sessionId}/next`)
        .set('X-Device-Fingerprint', guestFingerprint);

      expect(nextResponse.body.progress).toBeDefined();
      expect(nextResponse.body.progress.completed).toBe(0);

      const wordId = nextResponse.body.words[0]?.id;
      if (wordId) {
        await request(app.getHttpServer())
          .post(`/learning/sessions/${sessionId}/submit`)
          .set('X-Device-Fingerprint', guestFingerprint)
          .send({
            wordId,
            rating: 3,
            responseTimeMs: 5000,
            isCorrect: true,
          });

        // Check progress updated
        const nextResponse2 = await request(app.getHttpServer())
          .get(`/learning/sessions/${sessionId}/next`)
          .set('X-Device-Fingerprint', guestFingerprint);

        expect(nextResponse2.body.progress.completed).toBeGreaterThan(0);
      }
    });
  });
});
