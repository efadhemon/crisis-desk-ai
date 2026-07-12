import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the `reports` table plus the pgvector infrastructure used for
 * embedding-based duplicate detection.
 *
 * This migration is hand-written (not generated) because TypeORM has no native
 * `vector` column type. It provisions the `vector` extension, an `embedding
 * vector(768)` column, and an HNSW cosine index for fast nearest-neighbour
 * search.
 */
export class AddReportsAndPgvector1784200000000 implements MigrationInterface {
  name = 'AddReportsAndPgvector1784200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Required extensions
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

    await queryRunner.query(`
      CREATE TABLE "reports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "createdBy" jsonb,
        "updatedBy" jsonb,
        "deletedBy" jsonb,
        "name" character varying(150),
        "contact" character varying(150),
        "location" text NOT NULL,
        "description" text NOT NULL,
        "language" character varying(20) NOT NULL DEFAULT 'unknown',
        "category" character varying(30),
        "urgency" character varying(20),
        "summary" text,
        "suggestedAction" text,
        "confidence" double precision,
        "possibleDuplicate" boolean NOT NULL DEFAULT false,
        "matchedReportId" uuid,
        "status" character varying(20) NOT NULL DEFAULT 'pending',
        "embedding" vector(768),
        CONSTRAINT "PK_reports_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_reports_category" ON "reports" ("category")`);
    await queryRunner.query(`CREATE INDEX "idx_reports_urgency" ON "reports" ("urgency")`);
    await queryRunner.query(`CREATE INDEX "idx_reports_status" ON "reports" ("status")`);

    // HNSW index for cosine similarity search over embeddings.
    await queryRunner.query(
      `CREATE INDEX "idx_reports_embedding" ON "reports" USING hnsw ("embedding" vector_cosine_ops)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_reports_embedding"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_reports_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_reports_urgency"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_reports_category"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reports"`);
  }
}
