-- AlterTable
ALTER TABLE "SystemSettings" ADD COLUMN     "attendanceConfirmationMode" TEXT NOT NULL DEFAULT 'AUTO_CONFIRM';

-- CreateTable
CREATE TABLE "SessionConfirmation" (
    "id" TEXT NOT NULL,
    "trainingSessionId" TEXT NOT NULL,
    "athleteId" TEXT,
    "trainerId" TEXT,
    "confirmed" BOOLEAN NOT NULL DEFAULT true,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbsencePeriod" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT,
    "trainerId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AbsencePeriod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SessionConfirmation_trainingSessionId_idx" ON "SessionConfirmation"("trainingSessionId");

-- CreateIndex
CREATE INDEX "SessionConfirmation_athleteId_idx" ON "SessionConfirmation"("athleteId");

-- CreateIndex
CREATE INDEX "SessionConfirmation_trainerId_idx" ON "SessionConfirmation"("trainerId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionConfirmation_trainingSessionId_athleteId_key" ON "SessionConfirmation"("trainingSessionId", "athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionConfirmation_trainingSessionId_trainerId_key" ON "SessionConfirmation"("trainingSessionId", "trainerId");

-- CreateIndex
CREATE INDEX "AbsencePeriod_athleteId_idx" ON "AbsencePeriod"("athleteId");

-- CreateIndex
CREATE INDEX "AbsencePeriod_trainerId_idx" ON "AbsencePeriod"("trainerId");

-- CreateIndex
CREATE INDEX "AbsencePeriod_startDate_endDate_idx" ON "AbsencePeriod"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "AbsencePeriod_isActive_idx" ON "AbsencePeriod"("isActive");

-- AddForeignKey
ALTER TABLE "SessionConfirmation" ADD CONSTRAINT "SessionConfirmation_trainingSessionId_fkey" FOREIGN KEY ("trainingSessionId") REFERENCES "TrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionConfirmation" ADD CONSTRAINT "SessionConfirmation_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionConfirmation" ADD CONSTRAINT "SessionConfirmation_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsencePeriod" ADD CONSTRAINT "AbsencePeriod_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsencePeriod" ADD CONSTRAINT "AbsencePeriod_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsencePeriod" ADD CONSTRAINT "AbsencePeriod_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "TrainerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
