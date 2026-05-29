/*
  Warnings:

  - Made the column `description` on table `projects` required. This step will fail if there are existing NULL values in that column.
  - Made the column `clientName` on table `projects` required. This step will fail if there are existing NULL values in that column.
  - Made the column `startDate` on table `projects` required. This step will fail if there are existing NULL values in that column.
  - Made the column `endDate` on table `projects` required. This step will fail if there are existing NULL values in that column.
  - Made the column `devUrl` on table `projects` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uatUrl` on table `projects` required. This step will fail if there are existing NULL values in that column.
  - Made the column `prodUrl` on table `projects` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdById` on table `projects` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_createdById_fkey";

-- AlterTable
ALTER TABLE "projects" ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "clientName" SET NOT NULL,
ALTER COLUMN "startDate" SET NOT NULL,
ALTER COLUMN "endDate" SET NOT NULL,
ALTER COLUMN "devUrl" SET NOT NULL,
ALTER COLUMN "uatUrl" SET NOT NULL,
ALTER COLUMN "prodUrl" SET NOT NULL,
ALTER COLUMN "createdById" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
