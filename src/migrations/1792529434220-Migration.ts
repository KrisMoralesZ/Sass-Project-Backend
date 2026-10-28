import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1792529434220 implements MigrationInterface {
  name = 'Migration1792529434220';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "userId" uuid NOT NULL, "tokenId" character varying(64) NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "revokedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_610102b60fea1455310ccd299d" ON "refresh_tokens"  ("userId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_48064cd66bef5bbbcc3eb19622" ON "refresh_tokens"  ("tokenId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."organizations_plan_enum" AS ENUM('FREE', 'PRO', 'ENTERPRISE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "name" character varying(120) NOT NULL, "slug" character varying(120) NOT NULL, "plan" "public"."organizations_plan_enum" NOT NULL DEFAULT 'FREE', "settings" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_963693341bd612aa01ddf3a4b6" ON "organizations"  ("slug") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."organization_members_role_enum" AS ENUM('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "organization_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "organizationId" uuid NOT NULL, "userId" uuid NOT NULL, "role" "public"."organization_members_role_enum" NOT NULL DEFAULT 'MEMBER', CONSTRAINT "PK_c2b39d5d072886a4d9c8105eb9a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tenant_scoped_organization_id" ON "organization_members"  ("organizationId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e826222ad017663c6db1a45a4f" ON "organization_members"  ("userId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_7c48546e8026fb043d9ad0c2c8" ON "organization_members"  ("organizationId", "userId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "email" character varying(255) NOT NULL, "passwordHash" character varying(255) NOT NULL, "displayName" character varying(120), "failedLoginAttempts" integer NOT NULL DEFAULT '0', "lockedUntil" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users"  ("email") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "userId" uuid NOT NULL, "displayName" character varying(120), "avatarUrl" character varying(2048), "preferences" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "REL_8481388d6325e752cd4d7e26c6" UNIQUE ("userId"), CONSTRAINT "PK_1ec6662219f4605723f1e41b6cb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_8481388d6325e752cd4d7e26c6" ON "user_profiles"  ("userId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_members" ADD CONSTRAINT "FK_e826222ad017663c6db1a45a4f1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_members" ADD CONSTRAINT "FK_5652c2c6b066835b6c500d0d83f" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" ADD CONSTRAINT "FK_8481388d6325e752cd4d7e26c6d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_8481388d6325e752cd4d7e26c6d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_members" DROP CONSTRAINT "FK_5652c2c6b066835b6c500d0d83f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_members" DROP CONSTRAINT "FK_e826222ad017663c6db1a45a4f1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8481388d6325e752cd4d7e26c6"`,
    );
    await queryRunner.query(`DROP TABLE "user_profiles"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7c48546e8026fb043d9ad0c2c8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e826222ad017663c6db1a45a4f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_tenant_scoped_organization_id"`,
    );
    await queryRunner.query(`DROP TABLE "organization_members"`);
    await queryRunner.query(
      `DROP TYPE "public"."organization_members_role_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_963693341bd612aa01ddf3a4b6"`,
    );
    await queryRunner.query(`DROP TABLE "organizations"`);
    await queryRunner.query(`DROP TYPE "public"."organizations_plan_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_48064cd66bef5bbbcc3eb19622"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_610102b60fea1455310ccd299d"`,
    );
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
  }
}
