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
 * Contract tests for POST /learning/sessions/:id/submit
 * Validates API request/response match contracts/api.yaml specification
 */
describe('Learning Submit API Contract Tests', () => {
  let app: INestApplication;
  let bookRepository: Repository<Book>;
  let wordRepository: Repository<Word>;
  let userRepository: Repository<User>;
  let sessionRepository: Repository<LearningSession>;

  const guestFingerprint = 'contract_submit_test'.padEnd(64, 'a');
  let testBook: Book;
  let testWords: Word[];
  let sessionId: string;

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
      name: 'Contract Test Book',
      code: 'CONTRACT',
      description: 'Test book for contract tests',
      totalWords: 10,
      totalUnits: 1,
      isFree: false,
      sortOrder: 1,
    });

    testWords = [];
    for (let i = 0; i < 10; i++) {
      const word = await wordRepository.save({
        bookId: testBook.id,
        unitNumber: 1,
        word: `contractword${i}`,
        phoneticUs: `/test${i}/`,
        phoneticUk: `/test${i}/`,
        definitions: [{ pos: 'n.', meaning: `Contract test word ${i}` }],
        sortOrder: i,
      });
      testWords.push(word);
    }

    await userRepository.save({
      username: 'Contract Test User',
      memberType: MemberType.GUEST,
      deviceFingerprint: guestFingerprint,
    });

    // Create session for tests
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

  afterAll(async () => {
    await app.close();
  });

  describe('Request Schema: LearningSubmission', () => {
    it('should accept valid LearningSubmission with required fields', async () => {
      const response = await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          wordId: testWords[0].id,
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(200);

      expect(response.body).toHaveProperty('cardId');
    });

    it('should accept LearningSubmission with optional fields', async () => {
      const response = await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          wordId: testWords[1].id,
          rating: 3,
          responseTimeMs: 2500,
          userAnswer: 'abandon',
          isCorrect: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('cardId');
    });

    it('should require wordId (UUID format)', async () => {
      // Missing wordId
      await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(400);

      // Invalid wordId format
      await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          wordId: 'not-a-uuid',
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(400);
    });

    it('should require rating (integer 0-4)', async () => {
      // Missing rating
      await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          wordId: testWords[0].id,
          responseTimeMs: 2500,
        })
        .expect(400);

      // Rating below minimum
      await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          wordId: testWords[0].id,
          rating: -1,
          responseTimeMs: 2500,
        })
        .expect(400);

      // Rating above maximum
      await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          wordId: testWords[0].id,
          rating: 5,
          responseTimeMs: 2500,
        })
        .expect(400);
    });

    it('should require responseTimeMs (integer >= 0)', async () => {
      // Missing responseTimeMs
      await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          wordId: testWords[0].id,
          rating: 3,
        })
        .expect(400);

      // Negative responseTimeMs
      await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          wordId: testWords[0].id,
          rating: 3,
          responseTimeMs: -100,
        })
        .expect(400);
    });

    it('should accept all valid rating values (0-4)', async () => {
      for (const rating of [0, 1, 2, 3, 4]) {
        const response = await request(app.getHttpServer())
          .post(`/learning/sessions/${sessionId}/submit`)
          .set('X-Device-Fingerprint', guestFingerprint)
          .send({
            wordId: testWords[0].id,
            rating,
            responseTimeMs: 2500,
          })
          .expect(200);

        expect(response.body).toHaveProperty('cardId');
      }
    });
  });

  describe('Response Schema: LearningResult', () => {
    it('should return LearningResult with all required fields', async () => {
      const response = await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          wordId: testWords[0].id,
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(200);

      // Required fields per api.yaml
      expect(response.body).toHaveProperty('cardId');
      expect(response.body).toHaveProperty('newStatus');
      expect(response.body).toHaveProperty('stability');
      expect(response.body).toHaveProperty('difficulty');
      expect(response.body).toHaveProperty('nextDue');
      expect(response.body).toHaveProperty('coinsEarned');
    });

    it('should return cardId as UUID string', async () => {
      const response = await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          wordId: testWords[0].id,
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(200);

      expect(typeof response.body.cardId).toBe('string');
      // UUID format check
      expect(response.body.cardId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('should return newStatus as valid enum value', async () => {
      const response = await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          wordId: testWords[0].id,
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(200);

      expect(['new', 'learning', 'review', 'graduated']).toContain(
        response.body.newStatus,
      );
    });

    it('should return stability as number', async () => {
      const response = await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          wordId: testWords[0].id,
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(200);

      expect(typeof response.body.stability).toBe('number');
      expect(response.body.stability).toBeGreaterThanOrEqual(0);
    });

    it('should return difficulty as number', async () => {
      const response = await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          wordId: testWords[0].id,
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(200);

      expect(typeof response.body.difficulty).toBe('number');
      expect(response.body.difficulty).toBeGreaterThanOrEqual(0);
    });

    it('should return nextDue as ISO date-time string', async () => {
      const response = await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          wordId: testWords[0].id,
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(200);

      expect(typeof response.body.nextDue).toBe('string');
      const parsedDate = new Date(response.body.nextDue);
      expect(parsedDate.toString()).not.toBe('Invalid Date');
    });

    it('should return coinsEarned as integer', async () => {
      const response = await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          wordId: testWords[0].id,
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(200);

      expect(typeof response.body.coinsEarned).toBe('number');
      expect(Number.isInteger(response.body.coinsEarned)).toBe(true);
    });
  });

  describe('Error Response Schema', () => {
    it('should return Error schema on 400', async () => {
      const response = await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          wordId: 'invalid',
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return Error schema on 401', async () => {
      const response = await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .send({
          wordId: testWords[0].id,
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(401);

      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
    });

    it('should return Error schema on 403', async () => {
      const otherFingerprint = 'other_contract_test'.padEnd(64, 'b');

      const response = await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', otherFingerprint)
        .send({
          wordId: testWords[0].id,
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(403);

      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
    });

    it('should return Error schema on 404', async () => {
      const response = await request(app.getHttpServer())
        .post('/learning/sessions/00000000-0000-0000-0000-000000000000/submit')
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          wordId: testWords[0].id,
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(404);

      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Authentication Requirements', () => {
    it('should accept guestAuth via X-Device-Fingerprint', async () => {
      await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          wordId: testWords[0].id,
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(200);
    });

    it('should reject without authentication', async () => {
      await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .send({
          wordId: testWords[0].id,
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(401);
    });
  });

  describe('Path Parameter Validation', () => {
    it('should validate sessionId as UUID', async () => {
      await request(app.getHttpServer())
        .post('/learning/sessions/not-a-uuid/submit')
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          wordId: testWords[0].id,
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(400);
    });
  });
});
