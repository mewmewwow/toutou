/**
 * API Performance Tests
 * Target: p95 < 500ms for all critical endpoints
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('API Performance Tests (p95 < 500ms)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let bookId: string;
  let wordId: string;

  const measurePerformance = async (
    req: request.Test,
    label: string,
  ): Promise<number> => {
    const start = Date.now();
    await req.expect((res) => {
      const duration = Date.now() - start;
      console.log(`${label}: ${duration}ms`);
      return duration;
    });
    return Date.now() - start;
  };

  const runPerformanceTest = async (
    name: string,
    requestFn: () => request.Test,
    iterations: number = 20,
    p95Threshold: number = 500,
  ): Promise<void> => {
    const durations: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await requestFn();
      durations.push(Date.now() - start);
    }

    durations.sort((a, b) => a - b);

    const p50 = durations[Math.floor(durations.length * 0.5)];
    const p95 = durations[Math.floor(durations.length * 0.95)];
    const p99 = durations[Math.floor(durations.length * 0.99)];
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;

    console.log(`\n${name}:`);
    console.log(`  Average: ${avg.toFixed(2)}ms`);
    console.log(`  P50: ${p50}ms`);
    console.log(`  P95: ${p95}ms`);
    console.log(`  P99: ${p99}ms`);

    expect(p95).toBeLessThan(p95Threshold);
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Setup test data
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `perf-test-${Date.now()}@test.com`,
        password: 'Test1234!@#$',
        username: 'PerfTest',
      });

    authToken = registerRes.body.accessToken;
    userId = registerRes.body.user.id;

    // Get a book for testing
    const booksRes = await request(app.getHttpServer())
      .get('/books')
      .set('Authorization', `Bearer ${authToken}`);

    bookId = booksRes.body[0]?.id;

    // Get a word for testing
    if (bookId) {
      const wordsRes = await request(app.getHttpServer())
        .get(`/books/${bookId}/units/1/words`)
        .set('Authorization', `Bearer ${authToken}`);

      wordId = wordsRes.body[0]?.id;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Endpoints', () => {
    it('POST /auth/login should complete in < 500ms (p95)', async () => {
      await runPerformanceTest(
        'Login',
        () =>
          request(app.getHttpServer())
            .post('/auth/login')
            .send({
              email: `perf-test-${Date.now()}@test.com`,
              password: 'Test1234!@#$',
            })
            .expect(201),
        20,
        500,
      );
    });
  });

  describe('Books & Vocabulary Endpoints', () => {
    it('GET /books should complete in < 300ms (p95)', async () => {
      await runPerformanceTest(
        'List Books',
        () =>
          request(app.getHttpServer())
            .get('/books')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200),
        20,
        300,
      );
    });

    it('GET /books/:id/units/:unit/words should complete in < 200ms (p95)', async () => {
      if (!bookId) {
        console.log('Skipping: No book available');
        return;
      }

      await runPerformanceTest(
        'Load Unit Words',
        () =>
          request(app.getHttpServer())
            .get(`/books/${bookId}/units/1/words`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200),
        20,
        200,
      );
    });
  });

  describe('Learning Endpoints', () => {
    it('POST /learning/sessions should complete in < 300ms (p95)', async () => {
      if (!bookId) {
        console.log('Skipping: No book available');
        return;
      }

      await runPerformanceTest(
        'Start Learning Session',
        () =>
          request(app.getHttpServer())
            .post('/learning/sessions')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              bookId,
              unitNumber: 1,
              moduleType: 1,
            })
            .expect(201),
        20,
        300,
      );
    });
  });

  describe('Review Endpoints', () => {
    it('GET /reviews/due should complete in < 100ms (p95)', async () => {
      await runPerformanceTest(
        'Get Due Reviews',
        () =>
          request(app.getHttpServer())
            .get('/reviews/due')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200),
        20,
        100,
      );
    });

    it('GET /reviews/count/overdue should complete in < 50ms (p95)', async () => {
      await runPerformanceTest(
        'Count Overdue Reviews',
        () =>
          request(app.getHttpServer())
            .get('/reviews/count/overdue')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200),
        20,
        50,
      );
    });
  });

  describe('Rewards Endpoints', () => {
    it('GET /rewards/summary should complete in < 300ms (p95)', async () => {
      await runPerformanceTest(
        'Get Rewards Summary',
        () =>
          request(app.getHttpServer())
            .get('/rewards/summary')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200),
        20,
        300,
      );
    });

    it('GET /rewards/coins/balance should complete in < 100ms (p95)', async () => {
      await runPerformanceTest(
        'Get Coin Balance',
        () =>
          request(app.getHttpServer())
            .get('/rewards/coins/balance')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200),
        20,
        100,
      );
    });

    it('POST /rewards/streaks/record-login should complete in < 150ms (p95)', async () => {
      await runPerformanceTest(
        'Record Daily Login',
        () =>
          request(app.getHttpServer())
            .post('/rewards/streaks/record-login')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(201),
        20,
        150,
      );
    });
  });

  describe('User Profile Endpoints', () => {
    it('GET /users/me should complete in < 100ms (p95)', async () => {
      await runPerformanceTest(
        'Get User Profile',
        () =>
          request(app.getHttpServer())
            .get('/users/me')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200),
        20,
        100,
      );
    });
  });

  describe('Load Testing', () => {
    it('Should handle 10 concurrent requests within performance budget', async () => {
      if (!bookId) {
        console.log('Skipping: No book available');
        return;
      }

      const concurrentRequests = 10;
      const start = Date.now();

      const promises = Array.from({ length: concurrentRequests }, () =>
        request(app.getHttpServer())
          .get('/rewards/summary')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200),
      );

      await Promise.all(promises);

      const totalDuration = Date.now() - start;
      const avgDuration = totalDuration / concurrentRequests;

      console.log(`\nConcurrent Requests Test:`);
      console.log(`  Total Duration: ${totalDuration}ms`);
      console.log(`  Average per Request: ${avgDuration.toFixed(2)}ms`);
      console.log(`  Requests: ${concurrentRequests}`);

      // With concurrency, average should be better than sequential
      expect(avgDuration).toBeLessThan(500);
    });
  });
});
