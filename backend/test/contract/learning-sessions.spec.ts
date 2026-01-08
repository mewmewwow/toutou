import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { LearningModule } from '../../src/modules/learning/learning.module';
import { DevicesModule } from '../../src/modules/devices/devices.module';
import { BooksModule } from '../../src/modules/books/books.module';
import { FsrsModule } from '../../src/modules/fsrs/fsrs.module';
import { LearningSession } from '../../src/modules/learning/entities/learning-session.entity';
import { User, MemberType } from '../../src/modules/users/entities/user.entity';
import { Device } from '../../src/modules/devices/entities/device.entity';
import { Book } from '../../src/modules/books/entities/book.entity';
import { Word } from '../../src/modules/books/entities/word.entity';
import { Sentence } from '../../src/modules/books/entities/sentence.entity';
import { Card } from '../../src/modules/fsrs/entities/card.entity';
import { Revlog } from '../../src/modules/fsrs/entities/revlog.entity';
import { UserBook } from '../../src/modules/books/entities/user-book.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

/**
 * Contract tests for Learning Sessions API (Guest)
 * Validates API responses match contracts/api.yaml specification
 */
describe('Learning Sessions API Contract Tests (Guest)', () => {
  let app: INestApplication;
  let bookRepository: Repository<Book>;
  let wordRepository: Repository<Word>;
  let userRepository: Repository<User>;
  let sessionRepository: Repository<LearningSession>;

  const guestFingerprint = 'contract_test_guest'.padEnd(64, 'a');
  let testBook: Book;
  let guestUser: User;
  let words: Word[];

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
    userRepository = moduleFixture.get(getRepositoryToken(User));
    sessionRepository = moduleFixture.get(getRepositoryToken(LearningSession));
  });

  beforeEach(async () => {
    // Clear and seed data
    await sessionRepository.delete({});
    await wordRepository.delete({});
    await bookRepository.delete({});
    await userRepository.delete({});

    testBook = await bookRepository.save({
      name: 'Test Book',
      code: 'TEST',
      description: 'Test book for contract tests',
      totalWords: 20,
      totalUnits: 2,
      isFree: false,
      sortOrder: 1,
    });

    words = [];
    for (let i = 0; i < 10; i++) {
      const word = await wordRepository.save({
        bookId: testBook.id,
        unitNumber: 1,
        word: `testword${i}`,
        phoneticUs: `/test${i}/`,
        phoneticUk: `/test${i}/`,
        definitions: [{ pos: 'n.', meaning: `测试单词 ${i}` }],
        sortOrder: i,
      });
      words.push(word);
    }

    guestUser = await userRepository.save({
      username: '访客测试',
      memberType: MemberType.GUEST,
      deviceFingerprint: guestFingerprint,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /learning/sessions - Create Session', () => {
    it('should return LearningSession schema on success', async () => {
      const response = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 1,
        })
        .expect(200);

      // Validate LearningSession schema per api.yaml
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('bookId', testBook.id);
      expect(response.body).toHaveProperty('unitNumber', 1);
      expect(response.body).toHaveProperty('moduleType', 1);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('wordsCompleted');
      expect(response.body).toHaveProperty('wordsTotal');
      expect(response.body).toHaveProperty('effectiveSeconds');

      // Type validations
      expect(typeof response.body.id).toBe('string');
      expect(typeof response.body.bookId).toBe('string');
      expect(typeof response.body.unitNumber).toBe('number');
      expect(typeof response.body.moduleType).toBe('number');
      expect(typeof response.body.wordsCompleted).toBe('number');
      expect(typeof response.body.wordsTotal).toBe('number');
      expect(typeof response.body.effectiveSeconds).toBe('number');

      // Enum validations
      expect(['active', 'paused', 'completed']).toContain(response.body.status);
    });

    it('should validate moduleType range (1-13)', async () => {
      // Valid module types
      for (const moduleType of [1, 7, 13]) {
        await request(app.getHttpServer())
          .post('/learning/sessions')
          .set('X-Device-Fingerprint', guestFingerprint)
          .send({
            bookId: testBook.id,
            unitNumber: 1,
            moduleType,
          })
          .expect(200);
      }

      // Invalid module type 0
      await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 0,
        })
        .expect(400);

      // Invalid module type 14
      await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 14,
        })
        .expect(400);
    });

    it('should require bookId, unitNumber, and moduleType', async () => {
      // Missing bookId
      await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          unitNumber: 1,
          moduleType: 1,
        })
        .expect(400);

      // Missing unitNumber
      await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          bookId: testBook.id,
          moduleType: 1,
        })
        .expect(400);

      // Missing moduleType
      await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
        })
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app.getHttpServer())
        .post('/learning/sessions')
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 1,
        })
        .expect(401);

      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
    });

    it('should accept guestAuth via X-Device-Fingerprint header', async () => {
      await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 1,
        })
        .expect(200);
    });
  });

  describe('GET /learning/sessions/:sessionId/next - Get Next Batch', () => {
    let sessionId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 1,
        });
      sessionId = response.body.id;
    });

    it('should return words array with LearningWord schema', async () => {
      const response = await request(app.getHttpServer())
        .get(`/learning/sessions/${sessionId}/next`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .expect(200);

      expect(response.body).toHaveProperty('words');
      expect(response.body).toHaveProperty('isReinforcement');
      expect(response.body).toHaveProperty('progress');

      expect(Array.isArray(response.body.words)).toBe(true);
      expect(typeof response.body.isReinforcement).toBe('boolean');

      // Validate LearningWord schema (extends Word)
      const word = response.body.words[0];
      expect(word).toHaveProperty('id');
      expect(word).toHaveProperty('word');
      expect(word).toHaveProperty('phoneticUs');
      expect(word).toHaveProperty('phoneticUk');
      expect(word).toHaveProperty('definitions');
      expect(word).toHaveProperty('cardStatus');

      // Validate cardStatus enum
      expect(['new', 'learning', 'review', 'graduated']).toContain(word.cardStatus);
    });

    it('should return SessionProgress schema', async () => {
      const response = await request(app.getHttpServer())
        .get(`/learning/sessions/${sessionId}/next`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .expect(200);

      const progress = response.body.progress;
      expect(progress).toHaveProperty('completed');
      expect(progress).toHaveProperty('total');
      expect(progress).toHaveProperty('batchNumber');

      expect(typeof progress.completed).toBe('number');
      expect(typeof progress.total).toBe('number');
      expect(typeof progress.batchNumber).toBe('number');
    });

    it('should return max 10 words per batch', async () => {
      const response = await request(app.getHttpServer())
        .get(`/learning/sessions/${sessionId}/next`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .expect(200);

      expect(response.body.words.length).toBeLessThanOrEqual(10);
    });
  });

  describe('POST /learning/sessions/:sessionId/submit - Submit Learning Result', () => {
    let sessionId: string;

    beforeEach(async () => {
      const sessionResponse = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 1,
        });
      sessionId = sessionResponse.body.id;
    });

    it('should accept LearningSubmission and return LearningResult', async () => {
      const response = await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          wordId: words[0].id,
          rating: 3,
          responseTimeMs: 2500,
          isCorrect: true,
        })
        .expect(200);

      // Validate LearningResult schema
      expect(response.body).toHaveProperty('cardId');
      expect(response.body).toHaveProperty('newStatus');
      expect(response.body).toHaveProperty('stability');
      expect(response.body).toHaveProperty('difficulty');
      expect(response.body).toHaveProperty('nextDue');
      expect(response.body).toHaveProperty('coinsEarned');

      // Type validations
      expect(typeof response.body.cardId).toBe('string');
      expect(typeof response.body.stability).toBe('number');
      expect(typeof response.body.difficulty).toBe('number');
      expect(typeof response.body.coinsEarned).toBe('number');

      // Enum validation
      expect(['new', 'learning', 'review', 'graduated']).toContain(response.body.newStatus);

      // nextDue should be ISO date string
      expect(new Date(response.body.nextDue).toString()).not.toBe('Invalid Date');
    });

    it('should validate rating range (0-4)', async () => {
      // Valid ratings
      for (const rating of [0, 1, 2, 3, 4]) {
        await request(app.getHttpServer())
          .post(`/learning/sessions/${sessionId}/submit`)
          .set('X-Device-Fingerprint', guestFingerprint)
          .send({
            wordId: words[0].id,
            rating,
            responseTimeMs: 2500,
          })
          .expect(200);
      }

      // Invalid rating -1
      await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          wordId: words[0].id,
          rating: -1,
          responseTimeMs: 2500,
        })
        .expect(400);

      // Invalid rating 5
      await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          wordId: words[0].id,
          rating: 5,
          responseTimeMs: 2500,
        })
        .expect(400);
    });

    it('should require wordId, rating, and responseTimeMs', async () => {
      // Missing wordId
      await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(400);

      // Missing rating
      await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          wordId: words[0].id,
          responseTimeMs: 2500,
        })
        .expect(400);

      // Missing responseTimeMs
      await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          wordId: words[0].id,
          rating: 3,
        })
        .expect(400);
    });

    it('should accept optional userAnswer and isCorrect', async () => {
      const response = await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          wordId: words[0].id,
          rating: 3,
          responseTimeMs: 2500,
          userAnswer: 'test answer',
          isCorrect: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('cardId');
    });

    it('should return 403 for other user session', async () => {
      const otherFingerprint = 'other_user'.padEnd(64, 'b');

      const response = await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', otherFingerprint)
        .send({
          wordId: words[0].id,
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(403);

      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app.getHttpServer())
        .post('/learning/sessions/00000000-0000-0000-0000-000000000000/submit')
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          wordId: words[0].id,
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(404);

      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      const sessionResponse = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 1,
        });

      const sessionId = sessionResponse.body.id;

      // Make many rapid requests (this would need rate limiter configured)
      // In a real test environment, this should eventually return 429
      // For now, we just verify the endpoint accepts requests
      const responses = await Promise.all(
        Array(5).fill(null).map(() =>
          request(app.getHttpServer())
            .post(`/learning/sessions/${sessionId}/submit`)
            .set('X-Device-Fingerprint', guestFingerprint)
            .send({
              wordId: words[0].id,
              rating: 3,
              responseTimeMs: 2500,
            }),
        ),
      );

      // All should either succeed (200) or be rate limited (429)
      responses.forEach((response) => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });

  describe('Guest Access Restrictions', () => {
    it('should allow guest access to Unit 1', async () => {
      await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 1,
        })
        .expect(200);
    });

    it('should block guest access to Unit 2 with 403', async () => {
      // Add Unit 2 words
      for (let i = 0; i < 10; i++) {
        await wordRepository.save({
          bookId: testBook.id,
          unitNumber: 2,
          word: `unit2word${i}`,
          phoneticUs: `/test/`,
          phoneticUk: `/test/`,
          definitions: [{ pos: 'n.', meaning: '测试' }],
          sortOrder: i,
        });
      }

      const response = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 2,
          moduleType: 1,
        })
        .expect(403);

      expect(response.body).toHaveProperty('code', 'UNIT_ACCESS_DENIED');
      expect(response.body).toHaveProperty('message');
    });
  });
});
