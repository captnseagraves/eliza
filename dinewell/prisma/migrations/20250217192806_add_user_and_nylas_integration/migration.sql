-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "agentUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nylasAccessToken" TEXT,
    "nylasRefreshToken" TEXT,
    "nylasAccountId" TEXT,
    "calendarConnected" BOOLEAN NOT NULL DEFAULT false,
    "calendarProvider" TEXT,
    "calendarId" TEXT,
    "calendarEmail" TEXT,
    "lastCalendarSync" TIMESTAMP(3),
    "calendarScope" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_agentUserId_key" ON "User"("agentUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_nylasAccountId_key" ON "User"("nylasAccountId");

-- CreateIndex
CREATE INDEX "User_agentUserId_idx" ON "User"("agentUserId");

-- CreateIndex
CREATE INDEX "User_nylasAccountId_idx" ON "User"("nylasAccountId");

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_agentUserId_fkey" FOREIGN KEY ("agentUserId") REFERENCES "User"("agentUserId") ON DELETE RESTRICT ON UPDATE CASCADE;
