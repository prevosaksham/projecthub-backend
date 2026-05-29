/*
  Warnings:

  - A unique constraint covering the columns `[projectId,assignedToId]` on the table `project_members` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "project_members_projectId_assignedToId_isDeleted_key";

-- CreateIndex
CREATE UNIQUE INDEX "project_members_projectId_assignedToId_key" ON "project_members"("projectId", "assignedToId");
