import { MigrationInterface, QueryRunner } from 'typeorm';

export class SchemaUpdate1783924943625 implements MigrationInterface {
  name = 'SchemaUpdate1783924943625';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "caches" ("key" character varying(255) NOT NULL, "value" jsonb NOT NULL, "ttl" double precision NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_36aa7e9493d61779ce80e3d6243" PRIMARY KEY ("key")); COMMENT ON COLUMN "caches"."ttl" IS 'TTL as a timestamp in seconds'`,
    );
    await queryRunner.query(
      `CREATE TABLE "reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "createdBy" jsonb, "updatedBy" jsonb, "deletedBy" jsonb, "name" character varying(150), "contact" character varying(150), "location" text NOT NULL, "description" text NOT NULL, "language" character varying(20) NOT NULL DEFAULT 'unknown', "category" character varying(30), "urgency" character varying(20), "summary" text, "suggestedAction" text, "confidence" double precision, "possibleDuplicate" boolean NOT NULL DEFAULT false, "matchedReportId" uuid, "status" character varying(20) NOT NULL DEFAULT 'pending', "embedding" vector(768) NOT NULL, CONSTRAINT "PK_d9013193989303580053c0b5ef6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_reports_category" ON "reports"  ("category") `);
    await queryRunner.query(`CREATE INDEX "idx_reports_urgency" ON "reports"  ("urgency") `);
    await queryRunner.query(`CREATE INDEX "idx_reports_status" ON "reports"  ("status") `);
    await queryRunner.query(`CREATE INDEX "idx_reports_embedding" ON "reports"  ("embedding") `);
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "createdBy" jsonb, "updatedBy" jsonb, "deletedBy" jsonb, "userType" character varying(100) NOT NULL, "firstName" character varying(100), "lastName" character varying(100), "fullName" character varying(225), "username" character varying(100), "email" character varying(150), "phoneNumber" character varying(20), "avatar" text, "authProvider" character varying(50) NOT NULL DEFAULT 'system', "authProviderMetaInfo" jsonb NOT NULL DEFAULT '{}', "password" text, "twoFactorSecret" text, "isTwoFactorEnabled" boolean DEFAULT false, "isVerified" boolean DEFAULT false, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_users_username" ON "users"  ("username") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_users_email" ON "users"  ("email") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_users_phone_number" ON "users"  ("phoneNumber") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_users_phone_number"`);
    await queryRunner.query(`DROP INDEX "public"."idx_users_email"`);
    await queryRunner.query(`DROP INDEX "public"."idx_users_username"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP INDEX "public"."idx_reports_embedding"`);
    await queryRunner.query(`DROP INDEX "public"."idx_reports_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_reports_urgency"`);
    await queryRunner.query(`DROP INDEX "public"."idx_reports_category"`);
    await queryRunner.query(`DROP TABLE "reports"`);
    await queryRunner.query(`DROP TABLE "caches"`);
  }
}
