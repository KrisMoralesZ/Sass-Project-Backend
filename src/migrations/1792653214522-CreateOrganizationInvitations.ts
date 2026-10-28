import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganizationInvitations1792653214522 implements MigrationInterface {
  name = 'CreateOrganizationInvitations1792653214522';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // TenantScopedEntity's organizationId index no longer has a fixed name
    // (Postgres index names are schema-global and would collide here).
    await queryRunner.query(
      `ALTER INDEX "public"."idx_tenant_scoped_organization_id" RENAME TO "IDX_5652c2c6b066835b6c500d0d83"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."organization_invitations_role_enum" AS ENUM('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."organization_invitations_status_enum" AS ENUM('pending', 'accepted', 'revoked', 'expired')`,
    );
    await queryRunner.query(
      `CREATE TABLE "organization_invitations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "organizationId" uuid NOT NULL, "email" character varying(255) NOT NULL, "role" "public"."organization_invitations_role_enum" NOT NULL DEFAULT 'MEMBER', "tokenHash" character varying(64) NOT NULL, "status" "public"."organization_invitations_status_enum" NOT NULL DEFAULT 'pending', "invitedByUserId" uuid NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_f172f12b8a9ee6584b661f57e24" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a36b0344f658384839d0ca3948" ON "organization_invitations"  ("organizationId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_73865099e3672ec1fe1235885b" ON "organization_invitations"  ("tokenHash") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7105f27475e50e99c69b87e348" ON "organization_invitations"  ("invitedByUserId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_024da793a3a67d2f802e5bdc36" ON "organization_invitations"  ("organizationId", "email") `,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_invitations" ADD CONSTRAINT "FK_a36b0344f658384839d0ca39483" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_invitations" ADD CONSTRAINT "FK_7105f27475e50e99c69b87e348e" FOREIGN KEY ("invitedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organization_invitations" DROP CONSTRAINT "FK_7105f27475e50e99c69b87e348e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_invitations" DROP CONSTRAINT "FK_a36b0344f658384839d0ca39483"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_024da793a3a67d2f802e5bdc36"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7105f27475e50e99c69b87e348"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_73865099e3672ec1fe1235885b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a36b0344f658384839d0ca3948"`,
    );
    await queryRunner.query(`DROP TABLE "organization_invitations"`);
    await queryRunner.query(
      `DROP TYPE "public"."organization_invitations_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."organization_invitations_role_enum"`,
    );
    await queryRunner.query(
      `ALTER INDEX "public"."IDX_5652c2c6b066835b6c500d0d83" RENAME TO "idx_tenant_scoped_organization_id"`,
    );
  }
}
