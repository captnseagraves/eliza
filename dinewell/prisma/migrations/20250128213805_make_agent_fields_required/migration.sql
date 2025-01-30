/*
  Warnings:

  - Made the column `agentUserId` on table `Invitation` required. This step will fail if there are existing NULL values in that column.
  - Made the column `agentRoomId` on table `Invitation` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "agentUserId" SET NOT NULL,
ALTER COLUMN "agentRoomId" SET NOT NULL;
