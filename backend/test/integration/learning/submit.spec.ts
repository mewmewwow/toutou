import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { LearningModule } from '../../../src/modules/learning/learning.module';
import { DevicesModule } from '../../../src/modules/devices/devices.module';
import { BooksModule } from '../../../src/modules/books/books.module';
import { FsrsModule } from '../../../src/modules/fsrs/fsrs.module';
import { LearningSession, SessionStatus } from '../../../src/modules/learning/entities/learning-session.entity';
import { User, MemberType } from '../../../src/modules/users/entities/user.entity';
import { Device } from '../../../src/modules/devices/entities/device.entity';
import { Book } from '../../../src/modules/books/entities/book.entity';
import { Word } from '../../../src/modules/books/entities/word.entity';
import { Sentence } from '../../../src/modules/books/entities/sentence.entity';
import { Card, CardStatus } from '../../../src/modules/fsrs/entities/card.entity';
import { Revlog } from '../../../src/modules/fsrs/entities/revlog.entity';
import { UserBook } from '../../../src/modules/books/entities/user-book.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('Learning Submission Flow (Integration)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let bookRepository: Repository<Book>;
  let wordRepository: Repository<Word>;
  let sessionRepository: Repository<LearningSession>;
  let cardRepository: Repository<Card>;

  const testFingerprint = 'submission_test'.padEnd(64, 'a');
  let testBook: Book;
  let testUser: User;
  let testWords: Word[];

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

    userRepository = moduleFixture.get(getRepositoryToken(User));
    bookRepository = moduleFixture.get(getRepositoryToken(Book));
    wordRepository = moduleFixture.get(getRepositoryToken(Word));
    sessionRepository = moduleFixture.get(getRepositoryToken(LearningSession));
    cardRepository = moduleFixture.get(getRepositoryToken(Card));
  });

  beforeEach(async () => {
    // Clear tables
    await cardRepository.delete({});
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

    // Create test words
    testWords = [];
    for (let i = 0; i < 20; i++) {
      const word = await wordRepository.save({
        bookId: testBook.id,
        unitNumber: 1,
        word: `word${i}`,
        phoneticUs: `/wɜːrd${i}/`,
        phoneticUk: `/wɜːd${i}/`,
        definitions: [{ pos: 'n.', meaning: `测试单词 ${i}` }],
        sortOrder: i,
      });
      testWords.push(word);
    }

    // Create test user
    testUser = await userRepository.save({
      username: '测试用户',
      memberType: MemberType.GUEST,
      deviceFingerprint: testFingerprint,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Complete Learning Submission Flow', () => {
    it('should create card on first submission', async () => {
      // Start session
      const sessionResponse = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', testFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 1,
        })
        .expect(200);

      const sessionId = sessionResponse.body.id;

      // Get words
      const wordsResponse = await request(app.getHttpServer())
        .get(`/learning/sessions/${sessionId}/next`)
        .set('X-Device-Fingerprint', testFingerprint)
        .expect(200);

      const firstWord = wordsResponse.body.words[0];

      // Submit with Good rating
      const submitResponse = await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', testFingerprint)
        .send({
          wordId: firstWord.id,
          rating: 3, // Good
          responseTimeMs: 2500,
          isCorrect: true,
        })
        .expect(200);

      // Verify card was created
      expect(submitResponse.body.cardId).toBeDefined();
      expect(submitResponse.body.newStatus).toBeDefined();

      // Verify card in database
      const card = await cardRepository.findOne({
        where: { id: submitResponse.body.cardId },
      });

      expect(card).toBeDefined();
      expect(card?.userId).toBe(testUser.id);
      expect(card?.wordId).toBe(firstWord.id);
      expect(card?.moduleType).toBe(1);
    });

    it('should update existing card on repeated submission', async () => {
      // Create existing card
      const existingCard = await cardRepository.save({
        userId: testUser.id,
        wordId: testWords[0].id,
        moduleType: 1,
        status: CardStatus.LEARNING,
        stability: 1.5,
        difficulty: 5.0,
        reviewCount: 2,
        errorCount: 1,
      });

      // Start session
      const sessionResponse = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', testFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 1,
        })
        .expect(200);

      // Submit answer
      const submitResponse = await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionResponse.body.id}/submit`)
        .set('X-Device-Fingerprint', testFingerprint)
        .send({
          wordId: testWords[0].id,
          rating: 3,
          responseTimeMs: 2000,
          isCorrect: true,
        })
        .expect(200);

      // Verify same card was updated
      expect(submitResponse.body.cardId).toBe(existingCard.id);

      // Verify card updated in database
      const updatedCard = await cardRepository.findOne({
        where: { id: existingCard.id },
      });

      expect(updatedCard?.reviewCount).toBe(3); // Was 2, now 3
    });

    it('should increment error count on Again rating', async () => {
      const sessionResponse = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', testFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 1,
        })
        .expect(200);

      const submitResponse = await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionResponse.body.id}/submit`)
        .set('X-Device-Fingerprint', testFingerprint)
        .send({
          wordId: testWords[0].id,
          rating: 1, // Again
          responseTimeMs: 5000,
          isCorrect: false,
        })
        .expect(200);

      const card = await cardRepository.findOne({
        where: { id: submitResponse.body.cardId },
      });

      expect(card?.errorCount).toBe(1);
    });

    it('should update session progress after submission', async () => {
      const sessionResponse = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', testFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 1,
        })
        .expect(200);

      const sessionId = sessionResponse.body.id;
      const initialCompleted = sessionResponse.body.wordsCompleted;

      // Submit answer
      await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionId}/submit`)
        .set('X-Device-Fingerprint', testFingerprint)
        .send({
          wordId: testWords[0].id,
          rating: 3,
          responseTimeMs: 2000,
        })
        .expect(200);

      // Check session progress
      const session = await sessionRepository.findOne({
        where: { id: sessionId },
      });

      expect(session?.wordsCompleted).toBe(initialCompleted + 1);
    });

    it('should complete session when all words done', async () => {
      // Create session with only 2 words for testing
      const session = await sessionRepository.save({
        userId: testUser.id,
        bookId: testBook.id,
        unitNumber: 1,
        moduleType: 1,
        wordsCompleted: 0,
        wordsTotal: 2,
        status: SessionStatus.ACTIVE,
        effectiveSeconds: 0,
      });

      // Submit both words
      for (let i = 0; i < 2; i++) {
        await request(app.getHttpServer())
          .post(`/learning/sessions/${session.id}/submit`)
          .set('X-Device-Fingerprint', testFingerprint)
          .send({
            wordId: testWords[i].id,
            rating: 3,
            responseTimeMs: 2000,
          })
          .expect(200);
      }

      // Check session completed
      const completedSession = await sessionRepository.findOne({
        where: { id: session.id },
      });

      expect(completedSession?.status).toBe(SessionStatus.COMPLETED);
    });
  });

  describe('FSRS State Updates', () => {
    it('should update stability after successful review', async () => {
      const sessionResponse = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', testFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 1,
        })
        .expect(200);

      const submitResponse = await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionResponse.body.id}/submit`)
        .set('X-Device-Fingerprint', testFingerprint)
        .send({
          wordId: testWords[0].id,
          rating: 3, // Good
          responseTimeMs: 2000,
        })
        .expect(200);

      expect(submitResponse.body.stability).toBeGreaterThan(0);
      expect(submitResponse.body.difficulty).toBeGreaterThan(0);
      expect(submitResponse.body.nextDue).toBeDefined();
    });

    it('should set appropriate next due date based on rating', async () => {
      const sessionResponse = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', testFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 1,
        })
        .expect(200);

      // Submit with Easy rating - should have longer interval
      const easyResponse = await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionResponse.body.id}/submit`)
        .set('X-Device-Fingerprint', testFingerprint)
        .send({
          wordId: testWords[0].id,
          rating: 4, // Easy
          responseTimeMs: 1500,
        })
        .expect(200);

      // Submit with Again rating - should have shorter interval
      const againResponse = await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionResponse.body.id}/submit`)
        .set('X-Device-Fingerprint', testFingerprint)
        .send({
          wordId: testWords[1].id,
          rating: 1, // Again
          responseTimeMs: 5000,
        })
        .expect(200);

      const easyDue = new Date(easyResponse.body.nextDue);
      const againDue = new Date(againResponse.body.nextDue);

      // Easy rating should have later due date than Again
      expect(easyDue.getTime()).toBeGreaterThan(againDue.getTime());
    });
  });

  describe('Concurrent Submissions', () => {
    it('should handle rapid consecutive submissions', async () => {
      const sessionResponse = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', testFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 1,
        })
        .expect(200);

      const sessionId = sessionResponse.body.id;

      // Submit multiple words rapidly
      const submissions = testWords.slice(0, 5).map((word) =>
        request(app.getHttpServer())
          .post(`/learning/sessions/${sessionId}/submit`)
          .set('X-Device-Fingerprint', testFingerprint)
          .send({
            wordId: word.id,
            rating: 3,
            responseTimeMs: 2000,
          }),
      );

      const results = await Promise.all(submissions);

      // All should succeed
      results.forEach((res) => {
        expect(res.status).toBe(200);
        expect(res.body.cardId).toBeDefined();
      });

      // Session should show 5 completed
      const session = await sessionRepository.findOne({
        where: { id: sessionId },
      });

      expect(session?.wordsCompleted).toBe(5);
    });
  });

  describe('Error Handling', () => {
    it('should reject submission for non-existent session', async () => {
      const response = await request(app.getHttpServer())
        .post('/learning/sessions/00000000-0000-0000-0000-000000000000/submit')
        .set('X-Device-Fingerprint', testFingerprint)
        .send({
          wordId: testWords[0].id,
          rating: 3,
          responseTimeMs: 2000,
        })
        .expect(404);

      expect(response.body.code).toBe('SESSION_NOT_FOUND');
    });

    it('should reject submission for other user session', async () => {
      const sessionResponse = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('X-Device-Fingerprint', testFingerprint)
        .send({
          bookId: testBook.id,
          unitNumber: 1,
          moduleType: 1,
        })
        .expect(200);

      const otherFingerprint = 'other_user'.padEnd(64, 'b');

      const response = await request(app.getHttpServer())
        .post(`/learning/sessions/${sessionResponse.body.id}/submit`)
        .set('X-Device-Fingerprint', otherFingerprint)
        .send({
          wordId: testWords[0].id,
          rating: 3,
          responseTimeMs: 2000,
        })
        .expect(403);

      expect(response.body.code).toBe('SESSION_ACCESS_DENIED');
    });
  });
});
