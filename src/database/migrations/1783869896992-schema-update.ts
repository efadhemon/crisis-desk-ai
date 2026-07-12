import { MigrationInterface, QueryRunner } from 'typeorm';

export class SchemaUpdate1783869896992 implements MigrationInterface {
  name = 'SchemaUpdate1783869896992';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "caches" ("key" character varying(255) NOT NULL, "value" jsonb NOT NULL, "ttl" double precision NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_36aa7e9493d61779ce80e3d6243" PRIMARY KEY ("key")); COMMENT ON COLUMN "caches"."ttl" IS 'TTL as a timestamp in seconds'`,
    );
    await queryRunner.query(
      `CREATE TABLE "api_keys" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "createdBy" jsonb, "updatedBy" jsonb, "deletedBy" jsonb, "title" character varying(100) NOT NULL, "key" character varying(100) NOT NULL, CONSTRAINT "PK_5c8a79801b44bd27b79228e1dad" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_api_keys_key" ON "api_keys"  ("key") `);
    await queryRunner.query(
      `CREATE TABLE "permission_types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "createdBy" jsonb, "updatedBy" jsonb, "deletedBy" jsonb, "title" character varying(100) NOT NULL, CONSTRAINT "PK_215b1e2fd4bb5499896fe8edaf4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_permission_types_title" ON "permission_types"  ("title") `,
    );
    await queryRunner.query(
      `CREATE TABLE "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "createdBy" jsonb, "updatedBy" jsonb, "deletedBy" jsonb, "title" character varying(100) NOT NULL, "permissionTypeId" uuid, CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_permissions_title" ON "permissions"  ("title") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_permissions_permission_type_id" ON "permissions"  ("permissionTypeId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "createdBy" jsonb, "updatedBy" jsonb, "deletedBy" jsonb, "title" character varying(100) NOT NULL, CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_roles_title" ON "roles"  ("title") `);
    await queryRunner.query(
      `CREATE TABLE "role_permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "createdBy" jsonb, "updatedBy" jsonb, "deletedBy" jsonb, "roleId" uuid NOT NULL, "permissionId" uuid NOT NULL, CONSTRAINT "PK_84059017c90bfcb701b8fa42297" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_role_permissions_role_id" ON "role_permissions"  ("roleId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_role_permissions_permission_id" ON "role_permissions"  ("permissionId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "gallery" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "createdBy" jsonb, "updatedBy" jsonb, "deletedBy" jsonb, "title" character varying(255), "caption" character varying(255), "source" character varying(255), "altText" character varying(255), "url" text NOT NULL, "key" character varying(255) NOT NULL, "mimetype" character varying(50) NOT NULL, "extension" character varying(10) NOT NULL, CONSTRAINT "PK_65d7a1ef91ddafb3e7071b188a0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "global_configs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "createdBy" jsonb, "updatedBy" jsonb, "deletedBy" jsonb, "otpExpiresInMin" integer NOT NULL DEFAULT '5', CONSTRAINT "PK_11ee16a4f622cd0417977408703" PRIMARY KEY ("id")); COMMENT ON COLUMN "global_configs"."otpExpiresInMin" IS 'OTP expiration time in minutes for generated authentication OTP'`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "createdBy" jsonb, "updatedBy" jsonb, "deletedBy" jsonb, "isDefault" boolean NOT NULL DEFAULT false, "roleId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_8acd5cf26ebd158416f477de799" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_user_roles_role_id" ON "user_roles"  ("roleId") `);
    await queryRunner.query(`CREATE INDEX "idx_user_roles_user_id" ON "user_roles"  ("userId") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_user_roles_user_id_role_id" ON "user_roles"  ("userId", "roleId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "createdBy" jsonb, "updatedBy" jsonb, "deletedBy" jsonb, "userType" character varying(100) NOT NULL, "firstName" character varying(100), "lastName" character varying(100), "fullName" character varying(225), "username" character varying(100), "email" character varying(150), "phoneNumber" character varying(20), "avatar" text, "authProvider" character varying(50) NOT NULL DEFAULT 'system', "authProviderMetaInfo" jsonb NOT NULL DEFAULT '{}', "password" text, "twoFactorSecret" text, "isTwoFactorEnabled" boolean DEFAULT false, "isVerified" boolean DEFAULT false, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_users_username" ON "users"  ("username") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_users_email" ON "users"  ("email") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_users_phone_number" ON "users"  ("phoneNumber") `,
    );
    await queryRunner.query(
      `CREATE TABLE "email_notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "createdBy" jsonb, "updatedBy" jsonb, "deletedBy" jsonb, "isSuccess" boolean NOT NULL DEFAULT false, "type" character varying(100) NOT NULL, "title" character varying(225) NOT NULL, "recipient" character varying(225) NOT NULL, "subject" character varying(225) NOT NULL, "body" text, "attachments" jsonb, "gatewayResponse" jsonb, "userId" uuid, CONSTRAINT "PK_f4d8ce5003f1ce04365090df2d2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_email_notifications_type" ON "email_notifications"  ("type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_email_notifications_user_id" ON "email_notifications"  ("userId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "email_gateways" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "createdBy" jsonb, "updatedBy" jsonb, "deletedBy" jsonb, "title" character varying(225) NOT NULL, "accountType" character varying(50) NOT NULL DEFAULT 'default', "type" character varying(50), "host" character varying(100) NOT NULL, "port" integer NOT NULL, "isSecure" boolean NOT NULL, "authUser" character varying(100) NOT NULL, "authPassword" character varying(100) NOT NULL, "senderEmail" character varying(100) NOT NULL, "senderLabel" character varying(100), "userId" uuid, CONSTRAINT "PK_6ab16f1fccfc20b0a7defc0a388" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_email_gateways_user_id" ON "email_gateways"  ("userId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "sms_gateways" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "createdBy" jsonb, "updatedBy" jsonb, "deletedBy" jsonb, "title" character varying(225) NOT NULL, "accountType" character varying(50) NOT NULL DEFAULT 'default', "requestMethod" character varying(50) NOT NULL, "requestEndpoint" text NOT NULL, "requestBody" jsonb, "userId" uuid, CONSTRAINT "PK_a51ae668b6c182e33bc4eacf22c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_sms_gateways_user_id" ON "sms_gateways"  ("userId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "sms_notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "createdBy" jsonb, "updatedBy" jsonb, "deletedBy" jsonb, "isSuccess" boolean NOT NULL DEFAULT false, "type" character varying(100) NOT NULL, "title" character varying(225) NOT NULL, "recipient" character varying(225) NOT NULL, "body" text, "gatewayResponse" jsonb, "userId" uuid, CONSTRAINT "PK_0aef4087bf6dcace6b1103e8abe" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_sms_notifications_type" ON "sms_notifications"  ("type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_sms_notifications_user_id" ON "sms_notifications"  ("userId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" ADD CONSTRAINT "fk_permissions_permission_type_id" FOREIGN KEY ("permissionTypeId") REFERENCES "permission_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "fk_role_permissions_role_id" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "fk_role_permissions_permission_id" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "fk_user_roles_role_id" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "fk_user_roles_user_id" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_notifications" ADD CONSTRAINT "fk_email_notifications_user_id" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_gateways" ADD CONSTRAINT "fk_email_gateways_user_id" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sms_gateways" ADD CONSTRAINT "fk_sms_gateways_user_id" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sms_notifications" ADD CONSTRAINT "fk_sms_notifications_user_id" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sms_notifications" DROP CONSTRAINT "fk_sms_notifications_user_id"`,
    );
    await queryRunner.query(`ALTER TABLE "sms_gateways" DROP CONSTRAINT "fk_sms_gateways_user_id"`);
    await queryRunner.query(
      `ALTER TABLE "email_gateways" DROP CONSTRAINT "fk_email_gateways_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_notifications" DROP CONSTRAINT "fk_email_notifications_user_id"`,
    );
    await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "fk_user_roles_user_id"`);
    await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "fk_user_roles_role_id"`);
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "fk_role_permissions_permission_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "fk_role_permissions_role_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" DROP CONSTRAINT "fk_permissions_permission_type_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_sms_notifications_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_sms_notifications_type"`);
    await queryRunner.query(`DROP TABLE "sms_notifications"`);
    await queryRunner.query(`DROP INDEX "public"."idx_sms_gateways_user_id"`);
    await queryRunner.query(`DROP TABLE "sms_gateways"`);
    await queryRunner.query(`DROP INDEX "public"."idx_email_gateways_user_id"`);
    await queryRunner.query(`DROP TABLE "email_gateways"`);
    await queryRunner.query(`DROP INDEX "public"."idx_email_notifications_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_email_notifications_type"`);
    await queryRunner.query(`DROP TABLE "email_notifications"`);
    await queryRunner.query(`DROP INDEX "public"."idx_users_phone_number"`);
    await queryRunner.query(`DROP INDEX "public"."idx_users_email"`);
    await queryRunner.query(`DROP INDEX "public"."idx_users_username"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP INDEX "public"."idx_user_roles_user_id_role_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_user_roles_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_user_roles_role_id"`);
    await queryRunner.query(`DROP TABLE "user_roles"`);
    await queryRunner.query(`DROP TABLE "global_configs"`);
    await queryRunner.query(`DROP TABLE "gallery"`);
    await queryRunner.query(`DROP INDEX "public"."idx_role_permissions_permission_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_role_permissions_role_id"`);
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(`DROP INDEX "public"."idx_roles_title"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP INDEX "public"."idx_permissions_permission_type_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_permissions_title"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
    await queryRunner.query(`DROP INDEX "public"."idx_permission_types_title"`);
    await queryRunner.query(`DROP TABLE "permission_types"`);
    await queryRunner.query(`DROP INDEX "public"."idx_api_keys_key"`);
    await queryRunner.query(`DROP TABLE "api_keys"`);
    await queryRunner.query(`DROP TABLE "caches"`);
  }
}
