import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { BooksModule } from '../../src/modules/books/books.module';
import { Book } from '../../src/modules/books/entities/book.entity';
import { Word } from '../../src/modules/books/entities/word.entity';
import { Sentence } from '../../src/modules/books/entities/sentence.entity';
import { UserBook } from '../../src/modules/books/entities/user-book.entity';
import { User, MemberType } from '../../src/modules/users/entities/user.entity';
import { Device } from '../../src/modules/devices/entities/device.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

/**
 * Contract tests for Books API
 * Validates API responses match contracts/api.yaml specification
 */
describe('Books API Contract Tests', () => {
  let app: INestApplication;
  let bookRepository: Repository<Book>;
  let wordRepository: Repository<Word>;
  let sentenceRepository: Repository<Sentence>;
  let userRepository: Repository<User>;

  const guestFingerprint = 'guest_test_fingerprint'.padEnd(64, 'a');
  const paidUserFingerprint = 'paid_user_fingerprint'.padEnd(64, 'b');

  let freeBook: Book;
  let paidBook: Book;
  let guestUser: User;
  let paidUser: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Book, Word, Sentence, UserBook, User, Device],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([Book, Word, Sentence, UserBook, User, Device]),
        BooksModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    bookRepository = moduleFixture.get(getRepositoryToken(Book));
    wordRepository = moduleFixture.get(getRepositoryToken(Word));
    sentenceRepository = moduleFixture.get(getRepositoryToken(Sentence));
    userRepository = moduleFixture.get(getRepositoryToken(User));
  });

  beforeEach(async () => {
    // Clear tables
    await sentenceRepository.delete({});
    await wordRepository.delete({});
    await bookRepository.delete({});
    await userRepository.delete({});

    // Create free book
    freeBook = await bookRepository.save({
      name: '高中英语词汇',
      code: 'HIGH_SCHOOL',
      description: '高中英语核心词汇',
      totalWords: 100,
      totalUnits: 10,
      isFree: true,
      coverImage: 'https://example.com/high-school.jpg',
      sortOrder: 2,
    });

    // Create paid book
    paidBook = await bookRepository.save({
      name: '大学英语四级词汇',
      code: 'CET4',
      description: '大学英语四级考试核心词汇',
      totalWords: 450,
      totalUnits: 45,
      isFree: false,
      coverImage: 'https://example.com/cet4.jpg',
      sortOrder: 1,
    });

    // Create words for both books
    for (let unit = 1; unit <= 3; unit++) {
      for (let i = 0; i < 10; i++) {
        const word = await wordRepository.save({
          bookId: paidBook.id,
          unitNumber: unit,
          word: `word${unit}_${i}`,
          phoneticUs: `/wɜːrd/`,
          phoneticUk: `/wɜːd/`,
          definitions: [{ pos: 'n.', meaning: `单词 ${unit}_${i} 的含义` }],
          sortOrder: i,
        });

        // Add sentences
        await sentenceRepository.save({
          wordId: word.id,
          contentEn: `This is an example sentence with word${unit}_${i}.`,
          contentCn: `这是一个包含 word${unit}_${i} 的例句。`,
          isPrimary: true,
          sortOrder: 0,
        });
      }
    }

    // Create guest user
    guestUser = await userRepository.save({
      username: '访客',
      memberType: MemberType.GUEST,
      deviceFingerprint: guestFingerprint,
    });

    // Create paid user
    paidUser = await userRepository.save({
      username: '付费用户',
      memberType: MemberType.PAID,
      deviceFingerprint: paidUserFingerprint,
      memberExpireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /books - List Books', () => {
    it('should return array of books matching Book schema', async () => {
      const response = await request(app.getHttpServer())
        .get('/books')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);

      // Validate Book schema
      const book = response.body[0];
      expect(book).toHaveProperty('id');
      expect(book).toHaveProperty('name');
      expect(book).toHaveProperty('code');
      expect(book).toHaveProperty('description');
      expect(book).toHaveProperty('totalWords');
      expect(book).toHaveProperty('totalUnits');
      expect(book).toHaveProperty('isFree');
      expect(book).toHaveProperty('coverImage');

      // Type validations
      expect(typeof book.id).toBe('string');
      expect(typeof book.name).toBe('string');
      expect(typeof book.code).toBe('string');
      expect(typeof book.totalWords).toBe('number');
      expect(typeof book.totalUnits).toBe('number');
      expect(typeof book.isFree).toBe('boolean');
    });

    it('should return books sorted by sortOrder', async () => {
      const response = await request(app.getHttpServer())
        .get('/books')
        .expect(200);

      // CET4 (sortOrder: 1) should come before HIGH_SCHOOL (sortOrder: 2)
      expect(response.body[0].code).toBe('CET4');
      expect(response.body[1].code).toBe('HIGH_SCHOOL');
    });

    it('should filter by isFree=true', async () => {
      const response = await request(app.getHttpServer())
        .get('/books?isFree=true')
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].code).toBe('HIGH_SCHOOL');
      expect(response.body[0].isFree).toBe(true);
    });

    it('should filter by isFree=false', async () => {
      const response = await request(app.getHttpServer())
        .get('/books?isFree=false')
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].code).toBe('CET4');
      expect(response.body[0].isFree).toBe(false);
    });
  });

  describe('GET /books/:bookId - Get Book Details', () => {
    it('should return BookDetail schema with units', async () => {
      const response = await request(app.getHttpServer())
        .get(`/books/${paidBook.id}`)
        .expect(200);

      // Base Book schema
      expect(response.body).toHaveProperty('id', paidBook.id);
      expect(response.body).toHaveProperty('name', paidBook.name);
      expect(response.body).toHaveProperty('code', paidBook.code);

      // Extended BookDetail properties
      expect(response.body).toHaveProperty('units');
      expect(Array.isArray(response.body.units)).toBe(true);

      // Validate unit schema
      const unit = response.body.units[0];
      expect(unit).toHaveProperty('number');
      expect(unit).toHaveProperty('wordCount');
      expect(unit).toHaveProperty('isAccessible');
      expect(typeof unit.number).toBe('number');
      expect(typeof unit.wordCount).toBe('number');
      expect(typeof unit.isAccessible).toBe('boolean');
    });

    it('should return 404 for non-existent book', async () => {
      const response = await request(app.getHttpServer())
        .get('/books/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
    });

    it('should mark only Unit 1 accessible for guest users', async () => {
      const response = await request(app.getHttpServer())
        .get(`/books/${paidBook.id}`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .expect(200);

      const unit1 = response.body.units.find((u: any) => u.number === 1);
      const unit2 = response.body.units.find((u: any) => u.number === 2);

      expect(unit1.isAccessible).toBe(true);
      expect(unit2.isAccessible).toBe(false);
    });

    it('should mark all units accessible for paid users', async () => {
      const response = await request(app.getHttpServer())
        .get(`/books/${paidBook.id}`)
        .set('Authorization', `Bearer mock-jwt-for-${paidUser.id}`)
        .expect(200);

      response.body.units.forEach((unit: any) => {
        expect(unit.isAccessible).toBe(true);
      });
    });
  });

  describe('GET /books/:bookId/units/:unitNumber/words - Get Unit Words', () => {
    it('should return Word array with sentences', async () => {
      const response = await request(app.getHttpServer())
        .get(`/books/${paidBook.id}/units/1/words`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(10);

      // Validate Word schema
      const word = response.body[0];
      expect(word).toHaveProperty('id');
      expect(word).toHaveProperty('word');
      expect(word).toHaveProperty('phoneticUs');
      expect(word).toHaveProperty('phoneticUk');
      expect(word).toHaveProperty('audioUs');
      expect(word).toHaveProperty('audioUk');
      expect(word).toHaveProperty('definitions');
      expect(word).toHaveProperty('sentences');

      // Validate definitions array
      expect(Array.isArray(word.definitions)).toBe(true);
      const definition = word.definitions[0];
      expect(definition).toHaveProperty('pos');
      expect(definition).toHaveProperty('meaning');

      // Validate sentences array
      expect(Array.isArray(word.sentences)).toBe(true);
      const sentence = word.sentences[0];
      expect(sentence).toHaveProperty('id');
      expect(sentence).toHaveProperty('contentEn');
      expect(sentence).toHaveProperty('contentCn');
      expect(sentence).toHaveProperty('isPrimary');
    });

    it('should return words sorted by sortOrder', async () => {
      const response = await request(app.getHttpServer())
        .get(`/books/${paidBook.id}/units/1/words`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .expect(200);

      for (let i = 0; i < response.body.length - 1; i++) {
        // Words should maintain their sort order
        expect(response.body[i].word).toBe(`word1_${i}`);
      }
    });

    it('should return 403 for guest accessing Unit 2', async () => {
      const response = await request(app.getHttpServer())
        .get(`/books/${paidBook.id}/units/2/words`)
        .set('X-Device-Fingerprint', guestFingerprint)
        .expect(403);

      // Validate Error schema
      expect(response.body).toHaveProperty('code', 'UNIT_ACCESS_DENIED');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('访客');
    });

    it('should allow paid user to access any unit', async () => {
      await request(app.getHttpServer())
        .get(`/books/${paidBook.id}/units/2/words`)
        .set('Authorization', `Bearer mock-jwt-for-${paidUser.id}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/books/${paidBook.id}/units/3/words`)
        .set('Authorization', `Bearer mock-jwt-for-${paidUser.id}`)
        .expect(200);
    });

    it('should return 404 for non-existent unit', async () => {
      const response = await request(app.getHttpServer())
        .get(`/books/${paidBook.id}/units/999/words`)
        .set('Authorization', `Bearer mock-jwt-for-${paidUser.id}`)
        .expect(404);

      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent book', async () => {
      await request(app.getHttpServer())
        .get('/books/00000000-0000-0000-0000-000000000000/units/1/words')
        .set('X-Device-Fingerprint', guestFingerprint)
        .expect(404);
    });
  });

  describe('Error Response Schema', () => {
    it('should return standard Error schema on 400', async () => {
      const response = await request(app.getHttpServer())
        .get('/books/invalid-uuid')
        .expect(400);

      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.code).toBe('string');
      expect(typeof response.body.message).toBe('string');
    });

    it('should return standard Error schema on 404', async () => {
      const response = await request(app.getHttpServer())
        .get('/books/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
    });

    it('should return Error with details when validation fails', async () => {
      // This would trigger a validation error
      const response = await request(app.getHttpServer())
        .get(`/books/${paidBook.id}/units/abc/words`)
        .expect(400);

      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
    });
  });
});
