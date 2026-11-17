import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProjects1794884579305 implements MigrationInterface {
  name = 'CreateProjects1794884579305';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."projects_status_enum" AS ENUM('ACTIVE', 'ARCHIVED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "projects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "organizationId" uuid NOT NULL, "name" character varying(120) NOT NULL, "description" text, "ownerId" uuid NOT NULL, "status" "public"."projects_status_enum" NOT NULL DEFAULT 'ACTIVE', "metadata" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "PK_projects_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_projects_organization_id" ON "projects" ("organizationId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_projects_owner_id" ON "projects" ("ownerId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD CONSTRAINT "FK_projects_organization_id" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD CONSTRAINT "FK_projects_owner_id" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "projects" DROP CONSTRAINT "FK_projects_owner_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" DROP CONSTRAINT "FK_projects_organization_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_projects_owner_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_projects_organization_id"`,
    );
    await queryRunner.query(`DROP TABLE "projects"`);
    await queryRunner.query(`DROP TYPE "public"."projects_status_enum"`);
  }
}
