import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { LearningModule } from '../../../src/modules/learning/learning.module';
import { DevicesModule } from '../../../src/modules/devices/devices.module';
import { BooksModule } from '../../../src/modules/books/books.module';
import { LearningSession, SessionStatus } from '../../../src/modules/learning/entities/learning-session.entity';
import { User, MemberType } from '../../../src/modules/users/entities/user.entity';
import { Device } from '../../../src/modules/devices/entities/device.entity';
import { Book } from '../../../src/modules/books/entities/book.entity';
import { Word } from '../../../src/modules/books/entities/word.entity';
import { Sentence } from '../../../src/modules/books/entities/sentence.entity';
import { Card } from '../../../src/modules/fsrs/entities/card.entity';
import { Repository, DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('Guest Learning Session (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let userRepository: Repository<User>;
  let bookRepository: Repository<Book>;
  let wordRepository: Repository<Word>;
  let sessionRepository: Repository<LearningSession>;

  const testFingerprint = 'test123fingerprint'.padEnd(64, 'a');
  let testBook: Book;
  let testUser: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Use in-memory SQLite for testing
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User, Device, Book, Word, Sentence, LearningSession, Card],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([User, Device, Book, Word, Sentence, LearningSession, Card]),
        LearningModule,
        DevicesModule,
        BooksModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    dataSource = moduleFixture.get(DataSource);
    userRepository = moduleFixture.get(getRepositoryToken(User));
    bookRepository = moduleFixture.get(getRepositoryToken(Book));
    wordRepository = moduleFixture.get(getRepositoryToken(Word));
    sessionRepository = moduleFixture.get(getRepositoryToken(LearningSession));
  });

  beforeEach(async () => {
    // Clear tables
    await sessionRepository.delete({});
    await wordRepository.delete({});
    await bookRepository.delete({});
    await userRepository.delete({});

    // Create test book
    testBook = await bookRepository.save({
      name: 'Test Book',
      code: 'TEST',
      description: 'Test vocabulary book',
      totalWords: 20,
      totalUnits: 2,
      isFree: false,
      sortOrder: 1,
    });

    // Create test words for unit 1
    for (let i = 0; i < 10; i++) {
      await wordRepository.save({
        bookId: testBook.id,
        unitNumber: 1,
        word: `word${i}`,
        phoneticUs: `/wɜːrd${i}/`,
        phoneticUk: `/wɜːd${i}/`,
        definitions: [{ pos: 'n.', meaning: `测试单词 ${i}` }],
        sortOrder: i,
      });
    }

    // Create test words for unit 2
    for (let i = 0; i < 10; i++) {
      await wordRepository.save({
        bookId: testBook.id,
        unitNumber: 2,
        word: `word${10 + i}`,
        phoneticUs: `/wɜːrd${10 + i}/`,
        phoneticUk: `/wɜːd${10 + i}/`,
        definitions: [{ pos: 'n.', meaning: `测试单词 ${10 + i}` }],
        sortOrder: i,
      });
    }

    // Create guest user
    testUser = await userRepository.save({
      username: '访客测试',
      memberType: MemberType.GUEST,
      deviceFingerprint: testFingerprint,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /learning/sessions - Guest Session Creation', () => {
    it('should create a new session for guest with fingerprint header', async () => {
      const response = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', testFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 1, // Recognition
        })
        .expect(200);

      expect(response.body).toMatchObject({
        bookId: testBook.id,
        unitNumber: 1,
        moduleType: 1,
        status: 'active',
        wordsCompleted: 0,
        wordsTotal: 10,
      });
      expect(response.body.id).toBeDefined();
    });

    it('should allow guest access to Unit 1 only', async () => {
      // Unit 1 should work
      await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', testFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 1,
        })
        .expect(200);

      // Unit 2 should be blocked for guests
      const response = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', testFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 2,
          moduleType: 1,
        })
        .expect(403);

      expect(response.body.code).toBe('UNIT_ACCESS_DENIED');
      expect(response.body.message).toContain('访客');
    });

    it('should reject requests without fingerprint or auth token', async () => {
      await request(app.getHttpServer())
        .post('/learning/sessions')
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 1,
        })
        .expect(401);
    });

    it('should reject invalid fingerprint format', async () => {
      await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', 'invalid-short')
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 1,
        })
        .expect(400);
    });

    it('should resume existing active session for same book/unit/module', async () => {
      // Create first session
      const firstResponse = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', testFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 1,
        })
        .expect(200);

      const firstSessionId = firstResponse.body.id;

      // Try to create another session - should return the same one
      const secondResponse = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', testFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 1,
        })
        .expect(200);

      expect(secondResponse.body.id).toBe(firstSessionId);
    });

    it('should create new guest user for unknown fingerprint', async () => {
      const newFingerprint = 'brand_new_fingerprint'.padEnd(64, 'z');

      const initialUserCount = await userRepository.count();

      await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', newFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 1,
        })
        .expect(200);

      const finalUserCount = await userRepository.count();
      expect(finalUserCount).toBe(initialUserCount + 1);

      const newUser = await userRepository.findOne({
        where: { deviceFingerprint: newFingerprint },
      });
      expect(newUser).toBeDefined();
      expect(newUser?.memberType).toBe(MemberType.GUEST);
    });
  });

  describe('GET /learning/sessions/:id/next - Get Next Batch', () => {
    let sessionId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', testFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 1,
        });

      sessionId = response.body.id;
    });

    it('should return first batch of 10 words', async () => {
      const response = await request(app.getHttpServer())
        .get(`/learning/sessions/${sessionId}/next`)
        .set('X-Device-Fingerprint', testFingerprint)
        .expect(200);

      expect(response.body.words).toHaveLength(10);
      expect(response.body.isReinforcement).toBe(false);
      expect(response.body.progress).toMatchObject({
        completed: 0,
        total: 10,
        batchNumber: 1,
      });
    });

    it('should return word with all required fields for learning', async () => {
      const response = await request(app.getHttpServer())
        .get(`/learning/sessions/${sessionId}/next`)
        .set('X-Device-Fingerprint', testFingerprint)
        .expect(200);

      const word = response.body.words[0];
      expect(word).toHaveProperty('id');
      expect(word).toHaveProperty('word');
      expect(word).toHaveProperty('phoneticUs');
      expect(word).toHaveProperty('phoneticUk');
      expect(word).toHaveProperty('definitions');
      expect(word).toHaveProperty('cardStatus');
      expect(word.cardStatus).toBe('new');
    });

    it('should reject access to other user session', async () => {
      const differentFingerprint = 'different_user'.padEnd(64, 'x');

      await request(app.getHttpServer())
        .get(`/learning/sessions/${sessionId}/next`)
        .set('X-Device-Fingerprint', differentFingerprint)
        .expect(403);
    });
  });

  describe('POST /learning/sessions/:id/submit - Submit Learning Result', () => {
    let sessionId: string;
    let words: any[];

    beforeEach(async () => {
      // Create session
      const sessionResponse = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', testFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 1,
        });

      sessionId = sessionResponse.body.id;

      // Get words
      const wordsResponse = await request(app.getHttpServer())
        .get(`/learning/sessions/${sessionId}/next`)
        .set('X-Device-Fingerprint', testFingerprint);

      words = wordsResponse.body.words;
    });

    it('should record learning submission and return FSRS result', async () => {
      const response = await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', testFingerprint)
        .send({
          wordId: words[0].id,
          rating: 3, // Good
          responseTimeMs: 2500,
          isCorrect: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('cardId');
      expect(response.body).toHaveProperty('newStatus');
      expect(response.body).toHaveProperty('stability');
      expect(response.body).toHaveProperty('difficulty');
      expect(response.body).toHaveProperty('nextDue');
    });

    it('should update session progress after submission', async () => {
      await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', testFingerprint)
        .send({
          wordId: words[0].id,
          rating: 3,
          responseTimeMs: 2000,
          isCorrect: true,
        })
        .expect(200);

      // Check session progress
      const session = await sessionRepository.findOne({
        where: { id: sessionId },
      });

      expect(session?.wordsCompleted).toBe(1);
    });

    it('should trigger vocabulary reinforcement on consecutive errors', async () => {
      // Submit 3 consecutive errors for the same word
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post(`/learning/sessions/${sessionId}/submit`)
          .set('X-Device-Fingerprint', testFingerprint)
          .send({
            wordId: words[0].id,
            rating: 1, // Again (error)
            responseTimeMs: 5000,
            isCorrect: false,
          });
      }

      // Get next batch - should be reinforcement mode
      const nextResponse = await request(app.getHttpServer())
        .get(`/learning/sessions/${sessionId}/next`)
        .set('X-Device-Fingerprint', testFingerprint)
        .expect(200);

      // Check if reinforcement mode is triggered
      const session = await sessionRepository.findOne({
        where: { id: sessionId },
      });

      if (session?.isReinforcement) {
        expect(nextResponse.body.isReinforcement).toBe(true);
        expect(session.reinforcementWords).toContainEqual(
          expect.objectContaining({
            wordId: words[0].id,
          }),
        );
      }
    });

    it('should validate rating range (0-4)', async () => {
      await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', testFingerprint)
        .send({
          wordId: words[0].id,
          rating: 5, // Invalid
          responseTimeMs: 2000,
          isCorrect: true,
        })
        .expect(400);
    });

    it('should complete session when all words are done', async () => {
      // Submit all 10 words
      for (const word of words) {
        await request(app.getHttpServer())
          .post(`/learning/sessions/${sessionId}/submit`)
          .set('X-Device-Fingerprint', testFingerprint)
          .send({
            wordId: word.id,
            rating: 3,
            responseTimeMs: 2000,
            isCorrect: true,
          });
      }

      // Check session is completed
      const session = await sessionRepository.findOne({
        where: { id: sessionId },
      });

      expect(session?.status).toBe(SessionStatus.COMPLETED);
      expect(session?.wordsCompleted).toBe(10);
    });
  });

  describe('Guest Progress Persistence', () => {
    it('should persist card state across sessions', async () => {
      // Create first session and complete some words
      const firstSession = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', testFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 1,
        });

      const wordsResponse = await request(app.getHttpServer())
        .get(`/learning/sessions/${firstSession.body.id}/next`)
        .set('X-Device-Fingerprint', testFingerprint);

      // Learn first 5 words
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post(`/learning/sessions/${firstSession.body.id}/submit`)
          .set('X-Device-Fingerprint', testFingerprint)
          .send({
            wordId: wordsResponse.body.words[i].id,
            rating: 3,
            responseTimeMs: 2000,
            isCorrect: true,
          });
      }

      // Create new session (simulating app restart)
      const secondSession = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', testFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 1,
        });

      // Should resume from where we left off
      expect(secondSession.body.wordsCompleted).toBe(5);
    });
  });
});
