import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1704067200000 implements MigrationInterface {
  name = 'InitialSchema1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums
    await queryRunner.query(`
      CREATE TYPE "member_type_enum" AS ENUM ('guest', 'free', 'trial', 'paid')
    `);
    await queryRunner.query(`
      CREATE TYPE "pronunciation_type_enum" AS ENUM ('us', 'uk')
    `);
    await queryRunner.query(`
      CREATE TYPE "card_status_enum" AS ENUM ('new', 'learning', 'review', 'graduated')
    `);
    await queryRunner.query(`
      CREATE TYPE "review_type_enum" AS ENUM ('learning', 'review', 'relearning')
    `);
    await queryRunner.query(`
      CREATE TYPE "session_status_enum" AS ENUM ('active', 'paused', 'completed')
    `);
    await queryRunner.query(`
      CREATE TYPE "test_mode_enum" AS ENUM ('normal', 'speed', 'ultimate')
    `);
    await queryRunner.query(`
      CREATE TYPE "coin_transaction_type_enum" AS ENUM (
        'learning_time', 'test_pass', 'test_score_refresh', 'daily_login',
        'monthly_streak', 'birthday', 'pk_win', 'pk_loss', 'review_lottery'
      )
    `);

    // Users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" VARCHAR(255) UNIQUE,
        "phone" VARCHAR(20) UNIQUE,
        "password_hash" VARCHAR(255),
        "username" VARCHAR(50) NOT NULL,
        "avatar" VARCHAR(500),
        "birthday" DATE,
        "total_coins" INT NOT NULL DEFAULT 0,
        "total_credits" INT NOT NULL DEFAULT 0,
        "level" INT NOT NULL DEFAULT 1,
        "member_type" member_type_enum NOT NULL DEFAULT 'guest',
        "member_expire_at" TIMESTAMP,
        "pronunciation_pref" pronunciation_type_enum NOT NULL DEFAULT 'us',
        "device_fingerprint" VARCHAR(64),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_user_email" ON "users" ("email") WHERE "email" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_user_phone" ON "users" ("phone") WHERE "phone" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_user_fingerprint" ON "users" ("device_fingerprint") WHERE "device_fingerprint" IS NOT NULL
    `);

    // Devices table
    await queryRunner.query(`
      CREATE TABLE "devices" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID REFERENCES "users"("id") ON DELETE CASCADE,
        "device_fingerprint" VARCHAR(64) NOT NULL,
        "device_name" VARCHAR(100),
        "last_active_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_device_fingerprint" ON "devices" ("device_fingerprint")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_device_user" ON "devices" ("user_id")
    `);

    // Books table
    await queryRunner.query(`
      CREATE TABLE "books" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(100) NOT NULL,
        "code" VARCHAR(50) NOT NULL UNIQUE,
        "description" TEXT,
        "total_words" INT NOT NULL,
        "total_units" INT NOT NULL,
        "is_free" BOOLEAN NOT NULL DEFAULT false,
        "cover_image" VARCHAR(500),
        "sort_order" INT NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_book_code" ON "books" ("code")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_book_sort" ON "books" ("sort_order")
    `);

    // Words table
    await queryRunner.query(`
      CREATE TABLE "words" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "book_id" UUID NOT NULL REFERENCES "books"("id") ON DELETE CASCADE,
        "unit_number" INT NOT NULL,
        "word" VARCHAR(100) NOT NULL,
        "phonetic_us" VARCHAR(100),
        "phonetic_uk" VARCHAR(100),
        "audio_us" VARCHAR(500),
        "audio_uk" VARCHAR(500),
        "definitions" JSONB NOT NULL,
        "sort_order" INT NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_word_book_unit" ON "words" ("book_id", "unit_number")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_word_book_unit_sort" ON "words" ("book_id", "unit_number", "sort_order")
    `);

    // Sentences table
    await queryRunner.query(`
      CREATE TABLE "sentences" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "word_id" UUID NOT NULL REFERENCES "words"("id") ON DELETE CASCADE,
        "content_en" TEXT NOT NULL,
        "content_cn" TEXT NOT NULL,
        "is_primary" BOOLEAN NOT NULL DEFAULT false,
        "audio_url" VARCHAR(500),
        "sort_order" INT NOT NULL DEFAULT 0
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_sentence_word" ON "sentences" ("word_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_sentence_word_primary" ON "sentences" ("word_id") WHERE "is_primary" = true
    `);

    // User Books table
    await queryRunner.query(`
      CREATE TABLE "user_books" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "book_id" UUID NOT NULL REFERENCES "books"("id") ON DELETE CASCADE,
        "is_current" BOOLEAN NOT NULL DEFAULT false,
        "unit_progress" JSONB NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_userbook_user" ON "user_books" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_userbook_user_current" ON "user_books" ("user_id") WHERE "is_current" = true
    `);

    // Cards table (FSRS state)
    await queryRunner.query(`
      CREATE TABLE "cards" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "word_id" UUID NOT NULL REFERENCES "words"("id") ON DELETE CASCADE,
        "module_type" INT NOT NULL,
        "status" card_status_enum NOT NULL DEFAULT 'new',
        "stability" DECIMAL(10, 4) NOT NULL DEFAULT 0,
        "difficulty" DECIMAL(10, 4) NOT NULL DEFAULT 0,
        "due_at" TIMESTAMP,
        "last_review_at" TIMESTAMP,
        "review_count" INT NOT NULL DEFAULT 0,
        "error_count" INT NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_card_user_due" ON "cards" ("user_id", "due_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_card_user_module_due" ON "cards" ("user_id", "module_type", "due_at")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_card_user_word_module" ON "cards" ("user_id", "word_id", "module_type")
    `);

    // Revlogs table (review history)
    await queryRunner.query(`
      CREATE TABLE "revlogs" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "card_id" UUID NOT NULL REFERENCES "cards"("id") ON DELETE CASCADE,
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "rating" INT NOT NULL,
        "response_time_ms" INT NOT NULL,
        "stability_before" DECIMAL(10, 4) NOT NULL,
        "stability_after" DECIMAL(10, 4) NOT NULL,
        "difficulty_before" DECIMAL(10, 4) NOT NULL,
        "difficulty_after" DECIMAL(10, 4) NOT NULL,
        "interval_before" INT NOT NULL,
        "interval_after" INT NOT NULL,
        "review_type" review_type_enum NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_revlog_card" ON "revlogs" ("card_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_revlog_user_date" ON "revlogs" ("user_id", "created_at")
    `);

    // Learning Sessions table
    await queryRunner.query(`
      CREATE TABLE "learning_sessions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "book_id" UUID NOT NULL REFERENCES "books"("id") ON DELETE CASCADE,
        "unit_number" INT NOT NULL,
        "module_type" INT NOT NULL,
        "words_completed" INT NOT NULL DEFAULT 0,
        "words_total" INT NOT NULL,
        "is_reinforcement" BOOLEAN NOT NULL DEFAULT false,
        "reinforcement_words" JSONB,
        "status" session_status_enum NOT NULL DEFAULT 'active',
        "effective_seconds" INT NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_session_user_active" ON "learning_sessions" ("user_id") WHERE "status" = 'active'
    `);

    // Test Attempts table
    await queryRunner.query(`
      CREATE TABLE "test_attempts" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "book_id" UUID NOT NULL REFERENCES "books"("id") ON DELETE CASCADE,
        "unit_number" INT NOT NULL,
        "module_type" INT NOT NULL,
        "test_mode" test_mode_enum NOT NULL,
        "score" INT NOT NULL,
        "total_questions" INT NOT NULL,
        "correct_answers" INT NOT NULL,
        "time_spent_ms" INT NOT NULL,
        "passed" BOOLEAN NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_test_user_book_unit_module" ON "test_attempts" ("user_id", "book_id", "unit_number", "module_type")
    `);

    // Coin Transactions table
    await queryRunner.query(`
      CREATE TABLE "coin_transactions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "amount" INT NOT NULL,
        "balance_after" INT NOT NULL,
        "type" coin_transaction_type_enum NOT NULL,
        "reference_id" UUID,
        "description" VARCHAR(255) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_coin_user_date" ON "coin_transactions" ("user_id", "created_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_coin_user_type_date" ON "coin_transactions" ("user_id", "type", "created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order (respecting foreign key constraints)
    await queryRunner.query(`DROP TABLE IF EXISTS "coin_transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "test_attempts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "learning_sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "revlogs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cards"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_books"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sentences"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "words"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "books"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "devices"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "coin_transaction_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "test_mode_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "session_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "review_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "card_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "pronunciation_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "member_type_enum"`);
  }
}
