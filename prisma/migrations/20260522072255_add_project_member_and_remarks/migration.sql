/*
  Warnings:

  - The primary key for the `project_members` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[projectId,assignedToId,isDeleted]` on the table `project_members` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "project_members" DROP CONSTRAINT "project_members_pkey",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "removedById" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD CONSTRAINT "project_members_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "project_remarks" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "projectId" TEXT NOT NULL,
    "remark" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_remarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_remarks_projectId_idx" ON "project_remarks"("projectId");

-- CreateIndex
CREATE INDEX "project_remarks_addedById_idx" ON "project_remarks"("addedById");

-- CreateIndex
CREATE INDEX "project_remarks_createdAt_idx" ON "project_remarks"("createdAt");

-- CreateIndex
CREATE INDEX "project_members_projectId_idx" ON "project_members"("projectId");

-- CreateIndex
CREATE INDEX "project_members_assignedToId_idx" ON "project_members"("assignedToId");

-- CreateIndex
CREATE INDEX "project_members_assignedById_idx" ON "project_members"("assignedById");

-- CreateIndex
CREATE INDEX "project_members_removedById_idx" ON "project_members"("removedById");

-- CreateIndex
CREATE UNIQUE INDEX "project_members_projectId_assignedToId_isDeleted_key" ON "project_members"("projectId", "assignedToId", "isDeleted");

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_removedById_fkey" FOREIGN KEY ("removedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_remarks" ADD CONSTRAINT "project_remarks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_remarks" ADD CONSTRAINT "project_remarks_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
