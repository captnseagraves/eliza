-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "agentRoomId" TEXT;

-- CreateIndex
CREATE INDEX "Invitation_agentRoomId_idx" ON "Invitation"("agentRoomId");
