import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOptimizationIndexes1700000000000 implements MigrationInterface {
  name = 'AddOptimizationIndexes1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Best score covering index for test attempts
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_attempts_best_score"
      ON "test_attempts"("user_id", "book_id", "unit_number", "mode", "total_score" DESC)
    `);

    // Guest cleanup index
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_guest_cleanup"
      ON "users"("member_type", "updated_at")
      WHERE "member_type" = 'guest'
    `);

    // Trial expiration index
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_trial_expiration"
      ON "users"("member_type", "member_expire_at")
      WHERE "member_type" = 'trial'
    `);

    // Overdue card counting index
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_cards_user_state_due"
      ON "cards"("user_id", "state", "due_date")
    `);

    // Certificates recent query optimization
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_certificates_user_date"
      ON "certificates"("user_id", "awarded_at" DESC)
    `);

    // Learning session history optimization
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_learning_sessions_completion"
      ON "learning_sessions"("user_id", "completed_at" DESC)
      WHERE "completed_at" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_learning_sessions_completion"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_certificates_user_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_cards_user_state_due"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_trial_expiration"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_guest_cleanup"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_attempts_best_score"`);
  }
}
