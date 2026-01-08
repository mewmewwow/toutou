import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { ReviewModule } from '../../src/modules/review/review.module';
import { DevicesModule } from '../../src/modules/devices/devices.module';
import { BooksModule } from '../../src/modules/books/books.module';
import { FsrsModule } from '../../src/modules/fsrs/fsrs.module';
import { LearningModule } from '../../src/modules/learning/learning.module';
import { User, MemberType } from '../../src/modules/users/entities/user.entity';
import { Device } from '../../src/modules/devices/entities/device.entity';
import { Book } from '../../src/modules/books/entities/book.entity';
import { Word } from '../../src/modules/books/entities/word.entity';
import { Sentence } from '../../src/modules/books/entities/sentence.entity';
import { Card, CardStatus } from '../../src/modules/fsrs/entities/card.entity';
import { Revlog } from '../../src/modules/fsrs/entities/revlog.entity';
import { LearningSession } from '../../src/modules/learning/entities/learning-session.entity';
import { UserBook } from '../../src/modules/books/entities/user-book.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

/**
 * Contract tests for POST /review/cards/:id
 * Validates API request/response match contracts/api.yaml specification
 */
describe('Review Submit API Contract Tests', () => {
  let app: INestApplication;
  let cardRepository: Repository<Card>;
  let userRepository: Repository<User>;
  let wordRepository: Repository<Word>;
  let bookRepository: Repository<Book>;

  const guestFingerprint = 'review_submit_test'.padEnd(64, 'a');
  let testUser: User;
  let testBook: Book;
  let testWord: Word;
  let testCard: Card;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            User, Device, Book, Word, Sentence,
            Card, Revlog, LearningSession, UserBook,
          ],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([
          User, Device, Book, Word, Sentence,
          Card, Revlog, LearningSession, UserBook,
        ]),
        ReviewModule,
        DevicesModule,
        BooksModule,
        FsrsModule,
        LearningModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    cardRepository = moduleFixture.get(getRepositoryToken(Card));
    userRepository = moduleFixture.get(getRepositoryToken(User));
    wordRepository = moduleFixture.get(getRepositoryToken(Word));
    bookRepository = moduleFixture.get(getRepositoryToken(Book));
  });

  beforeEach(async () => {
    await cardRepository.delete({});
    await wordRepository.delete({});
    await bookRepository.delete({});
    await userRepository.delete({});

    testUser = await userRepository.save({
      username: 'Review Submit User',
      memberType: MemberType.GUEST,
      deviceFingerprint: guestFingerprint,
    });

    testBook = await bookRepository.save({
      name: 'Review Submit Book',
      code: 'SUBMIT',
      description: 'Test book',
      totalWords: 5,
      totalUnits: 1,
      isFree: false,
      sortOrder: 1,
    });

    testWord = await wordRepository.save({
      bookId: testBook.id,
      unitNumber: 1,
      word: 'submitword',
      phoneticUs: '/test/',
      definitions: [{ pos: 'v.', meaning: 'to submit' }],
      sortOrder: 0,
    });

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    testCard = await cardRepository.save({
      userId: testUser.id,
      wordId: testWord.id,
      moduleType: 1,
      status: CardStatus.REVIEW,
      stability: 5,
      difficulty: 5,
      dueAt: yesterday,
      reviewCount: 1,
      errorCount: 0,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Request Schema: ReviewSubmission', () => {
    it('should accept valid ReviewSubmission with required fields', async () => {
      const response = await request(app.getHttpServer())
        .post(`/review/cards/${testCard.id}`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(200);

      expect(response.body).toHaveProperty('cardId');
    });

    it('should require rating (integer 1-4)', async () => {
      // Missing rating
      await request(app.getHttpServer())
        .post(`/review/cards/${testCard.id}`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          responseTimeMs: 2500,
        })
        .expect(400);

      // Rating below minimum
      await request(app.getHttpServer())
        .post(`/review/cards/${testCard.id}`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          rating: 0,
          responseTimeMs: 2500,
        })
        .expect(400);

      // Rating above maximum
      await request(app.getHttpServer())
        .post(`/review/cards/${testCard.id}`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          rating: 5,
          responseTimeMs: 2500,
        })
        .expect(400);
    });

    it('should require responseTimeMs (integer >= 0)', async () => {
      // Missing responseTimeMs
      await request(app.getHttpServer())
        .post(`/review/cards/${testCard.id}`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          rating: 3,
        })
        .expect(400);

      // Negative responseTimeMs
      await request(app.getHttpServer())
        .post(`/review/cards/${testCard.id}`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          rating: 3,
          responseTimeMs: -100,
        })
        .expect(400);
    });

    it('should accept all valid rating values (1-4)', async () => {
      for (const rating of [1, 2, 3, 4]) {
        // Need to recreate card as it gets updated
        const card = await cardRepository.save({
          userId: testUser.id,
          wordId: testWord.id,
          moduleType: rating, // Use different module to avoid conflicts
          status: CardStatus.REVIEW,
          stability: 5,
          difficulty: 5,
          dueAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          reviewCount: 1,
          errorCount: 0,
        });

        const response = await request(app.getHttpServer())
          .post(`/review/cards/${card.id}`)
          .set('X-Device-Fingerprint', guestFingerprint)
          .send({
            rating,
            responseTimeMs: 2500,
          })
          .expect(200);

        expect(response.body).toHaveProperty('cardId');
      }
    });
  });

  describe('Response Schema: ReviewResult', () => {
    it('should return ReviewResult with all required fields', async () => {
      const response = await request(app.getHttpServer())
        .post(`/review/cards/${testCard.id}`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(200);

      expect(response.body).toHaveProperty('cardId');
      expect(response.body).toHaveProperty('newStatus');
      expect(response.body).toHaveProperty('stability');
      expect(response.body).toHaveProperty('difficulty');
      expect(response.body).toHaveProperty('nextDue');
      expect(response.body).toHaveProperty('retrievability');
    });

    it('should return cardId as UUID', async () => {
      const response = await request(app.getHttpServer())
        .post(`/review/cards/${testCard.id}`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(200);

      expect(response.body.cardId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('should return valid status enum', async () => {
      const response = await request(app.getHttpServer())
        .post(`/review/cards/${testCard.id}`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(200);

      expect(['new', 'learning', 'review', 'graduated']).toContain(
        response.body.newStatus,
      );
    });

    it('should return nextDue as ISO date string', async () => {
      const response = await request(app.getHttpServer())
        .post(`/review/cards/${testCard.id}`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(200);

      const parsedDate = new Date(response.body.nextDue);
      expect(parsedDate.toString()).not.toBe('Invalid Date');
    });

    it('should return retrievability as number between 0 and 1', async () => {
      const response = await request(app.getHttpServer())
        .post(`/review/cards/${testCard.id}`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(200);

      expect(typeof response.body.retrievability).toBe('number');
      expect(response.body.retrievability).toBeGreaterThanOrEqual(0);
      expect(response.body.retrievability).toBeLessThanOrEqual(1);
    });
  });

  describe('Error Responses', () => {
    it('should return 404 for non-existent card', async () => {
      const response = await request(app.getHttpServer())
        .post('/review/cards/00000000-0000-0000-0000-000000000000')
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(404);

      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
    });

    it('should return 403 for card owned by another user', async () => {
      const otherFingerprint = 'other_review_user'.padEnd(64, 'b');

      const response = await request(app.getHttpServer())
        .post(`/review/cards/${testCard.id}`)
        .set('X-Device-Fingerprint', otherFingerprint)
        .send({
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(403);

      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post(`/review/cards/${testCard.id}`)
        .send({
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(401);
    });
  });

  describe('FSRS Updates', () => {
    it('should update stability after review', async () => {
      const originalStability = testCard.stability;

      await request(app.getHttpServer())
        .post(`/review/cards/${testCard.id}`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          rating: 3,
          responseTimeMs: 2500,
        })
        .expect(200);

      const updatedCard = await cardRepository.findOne({
        where: { id: testCard.id },
      });

      expect(Number(updatedCard?.stability)).not.toBe(originalStability);
    });

    it('should schedule next review based on rating', async () => {
      const response = await request(app.getHttpServer())
        .post(`/review/cards/${testCard.id}`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .send({
          rating: 4, // Easy - should schedule further
          responseTimeMs: 1500,
        })
        .expect(200);

      const nextDue = new Date(response.body.nextDue);
      const now = new Date();

      // Easy rating should schedule at least 1 day in future
      expect(nextDue.getTime()).toBeGreaterThan(now.getTime());
    });
  });
});
