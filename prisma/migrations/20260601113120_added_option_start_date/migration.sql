-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

-- AlterTable
ALTER TABLE "projects" ALTER COLUMN "name" DROP NOT NULL;
