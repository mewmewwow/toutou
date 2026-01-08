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
 * Contract tests for GET /review/due
 * Validates API response matches contracts/api.yaml specification
 */
describe('Review Due API Contract Tests', () => {
  let app: INestApplication;
  let cardRepository: Repository<Card>;
  let userRepository: Repository<User>;
  let wordRepository: Repository<Word>;
  let bookRepository: Repository<Book>;

  const guestFingerprint = 'review_due_test'.padEnd(64, 'a');
  let testUser: User;
  let testBook: Book;
  let testWords: Word[];

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
      username: 'Review Test User',
      memberType: MemberType.GUEST,
      deviceFingerprint: guestFingerprint,
    });

    testBook = await bookRepository.save({
      name: 'Review Test Book',
      code: 'REVIEW',
      description: 'Test book for review',
      totalWords: 10,
      totalUnits: 1,
      isFree: false,
      sortOrder: 1,
    });

    testWords = [];
    for (let i = 0; i < 5; i++) {
      const word = await wordRepository.save({
        bookId: testBook.id,
        unitNumber: 1,
        word: `reviewword${i}`,
        phoneticUs: `/test${i}/`,
        definitions: [{ pos: 'n.', meaning: `Review test word ${i}` }],
        sortOrder: i,
      });
      testWords.push(word);
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /review/due', () => {
    it('should return empty array when no cards are due', async () => {
      const response = await request(app.getHttpServer())
        .get('/review/due')
        .set('X-Device-Fingerprint', guestFingerprint)
        .expect(200);

      expect(response.body).toHaveProperty('cards');
      expect(response.body.cards).toEqual([]);
      expect(response.body).toHaveProperty('totalDue', 0);
    });

    it('should return due cards with required fields', async () => {
      // Create a due card
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await cardRepository.save({
        userId: testUser.id,
        wordId: testWords[0].id,
        moduleType: 1,
        status: CardStatus.REVIEW,
        stability: 5,
        difficulty: 5,
        dueAt: yesterday,
        reviewCount: 1,
        errorCount: 0,
      });

      const response = await request(app.getHttpServer())
        .get('/review/due')
        .set('X-Device-Fingerprint', guestFingerprint)
        .expect(200);

      expect(response.body.cards).toHaveLength(1);
      expect(response.body.cards[0]).toHaveProperty('cardId');
      expect(response.body.cards[0]).toHaveProperty('wordId');
      expect(response.body.cards[0]).toHaveProperty('word');
      expect(response.body.cards[0]).toHaveProperty('moduleType');
      expect(response.body.cards[0]).toHaveProperty('dueAt');
      expect(response.body.cards[0]).toHaveProperty('retrievability');
    });

    it('should include blocking status in response', async () => {
      const response = await request(app.getHttpServer())
        .get('/review/due')
        .set('X-Device-Fingerprint', guestFingerprint)
        .expect(200);

      expect(response.body).toHaveProperty('isBlocked');
      expect(typeof response.body.isBlocked).toBe('boolean');
    });

    it('should order cards by due date ascending', async () => {
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      await cardRepository.save({
        userId: testUser.id,
        wordId: testWords[0].id,
        moduleType: 1,
        status: CardStatus.REVIEW,
        stability: 5,
        difficulty: 5,
        dueAt: yesterday,
        reviewCount: 1,
        errorCount: 0,
      });

      await cardRepository.save({
        userId: testUser.id,
        wordId: testWords[1].id,
        moduleType: 1,
        status: CardStatus.REVIEW,
        stability: 5,
        difficulty: 5,
        dueAt: twoDaysAgo,
        reviewCount: 1,
        errorCount: 0,
      });

      const response = await request(app.getHttpServer())
        .get('/review/due')
        .set('X-Device-Fingerprint', guestFingerprint)
        .expect(200);

      expect(response.body.cards).toHaveLength(2);
      // Older card should come first
      expect(response.body.cards[0].wordId).toBe(testWords[1].id);
    });

    it('should exclude graduated cards', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      await cardRepository.save({
        userId: testUser.id,
        wordId: testWords[0].id,
        moduleType: 1,
        status: CardStatus.GRADUATED,
        stability: 30,
        difficulty: 3,
        dueAt: yesterday,
        reviewCount: 5,
        errorCount: 0,
      });

      const response = await request(app.getHttpServer())
        .get('/review/due')
        .set('X-Device-Fingerprint', guestFingerprint)
        .expect(200);

      expect(response.body.cards).toHaveLength(0);
    });

    it('should support limit query parameter', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      for (let i = 0; i < 5; i++) {
        await cardRepository.save({
          userId: testUser.id,
          wordId: testWords[i].id,
          moduleType: 1,
          status: CardStatus.REVIEW,
          stability: 5,
          difficulty: 5,
          dueAt: yesterday,
          reviewCount: 1,
          errorCount: 0,
        });
      }

      const response = await request(app.getHttpServer())
        .get('/review/due?limit=3')
        .set('X-Device-Fingerprint', guestFingerprint)
        .expect(200);

      expect(response.body.cards).toHaveLength(3);
      expect(response.body.totalDue).toBe(5);
    });

    it('should support moduleType filter', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      await cardRepository.save({
        userId: testUser.id,
        wordId: testWords[0].id,
        moduleType: 1,
        status: CardStatus.REVIEW,
        stability: 5,
        difficulty: 5,
        dueAt: yesterday,
        reviewCount: 1,
        errorCount: 0,
      });

      await cardRepository.save({
        userId: testUser.id,
        wordId: testWords[1].id,
        moduleType: 2,
        status: CardStatus.REVIEW,
        stability: 5,
        difficulty: 5,
        dueAt: yesterday,
        reviewCount: 1,
        errorCount: 0,
      });

      const response = await request(app.getHttpServer())
        .get('/review/due?moduleType=1')
        .set('X-Device-Fingerprint', guestFingerprint)
        .expect(200);

      expect(response.body.cards).toHaveLength(1);
      expect(response.body.cards[0].moduleType).toBe(1);
    });
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/review/due')
        .expect(401);
    });

    it('should accept guest authentication', async () => {
      await request(app.getHttpServer())
        .get('/review/due')
        .set('X-Device-Fingerprint', guestFingerprint)
        .expect(200);
    });
  });
});
