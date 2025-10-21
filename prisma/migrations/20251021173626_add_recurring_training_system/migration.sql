/*
  Warnings:

  - You are about to drop the column `hourNumber` on the `TrainingSession` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[date,recurringTrainingId]` on the table `TrainingSession` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RecurrenceInterval" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- DropIndex
DROP INDEX "public"."TrainingSession_date_dayOfWeek_hourNumber_groupNumber_key";

-- DropIndex
DROP INDEX "public"."TrainingSession_dayOfWeek_hourNumber_groupNumber_idx";

-- AlterTable
ALTER TABLE "TrainingSession" DROP COLUMN "hourNumber",
ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledBy" TEXT,
ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "recurringTrainingId" TEXT,
ADD COLUMN     "startTime" TEXT;

-- CreateTable
CREATE TABLE "RecurringTraining" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "groupNumber" INTEGER NOT NULL,
    "recurrenceInterval" "RecurrenceInterval" NOT NULL DEFAULT 'WEEKLY',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringTraining_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringTrainingAthleteAssignment" (
    "id" TEXT NOT NULL,
    "recurringTrainingId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecurringTrainingAthleteAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringTrainingTrainerAssignment" (
    "id" TEXT NOT NULL,
    "recurringTrainingId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveUntil" TIMESTAMP(3),
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecurringTrainingTrainerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurringTraining_dayOfWeek_idx" ON "RecurringTraining"("dayOfWeek");

-- CreateIndex
CREATE INDEX "RecurringTraining_isActive_idx" ON "RecurringTraining"("isActive");

-- CreateIndex
CREATE INDEX "RecurringTraining_startDate_idx" ON "RecurringTraining"("startDate");

-- CreateIndex
CREATE INDEX "RecurringTrainingAthleteAssignment_recurringTrainingId_idx" ON "RecurringTrainingAthleteAssignment"("recurringTrainingId");

-- CreateIndex
CREATE INDEX "RecurringTrainingAthleteAssignment_athleteId_idx" ON "RecurringTrainingAthleteAssignment"("athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringTrainingAthleteAssignment_recurringTrainingId_athl_key" ON "RecurringTrainingAthleteAssignment"("recurringTrainingId", "athleteId");

-- CreateIndex
CREATE INDEX "RecurringTrainingTrainerAssignment_recurringTrainingId_idx" ON "RecurringTrainingTrainerAssignment"("recurringTrainingId");

-- CreateIndex
CREATE INDEX "RecurringTrainingTrainerAssignment_trainerId_idx" ON "RecurringTrainingTrainerAssignment"("trainerId");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringTrainingTrainerAssignment_recurringTrainingId_trai_key" ON "RecurringTrainingTrainerAssignment"("recurringTrainingId", "trainerId");

-- CreateIndex
CREATE INDEX "TrainingSession_dayOfWeek_groupNumber_idx" ON "TrainingSession"("dayOfWeek", "groupNumber");

-- CreateIndex
CREATE INDEX "TrainingSession_recurringTrainingId_idx" ON "TrainingSession"("recurringTrainingId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingSession_date_recurringTrainingId_key" ON "TrainingSession"("date", "recurringTrainingId");

-- AddForeignKey
ALTER TABLE "RecurringTraining" ADD CONSTRAINT "RecurringTraining_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Trainer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTrainingAthleteAssignment" ADD CONSTRAINT "RecurringTrainingAthleteAssignment_recurringTrainingId_fkey" FOREIGN KEY ("recurringTrainingId") REFERENCES "RecurringTraining"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTrainingAthleteAssignment" ADD CONSTRAINT "RecurringTrainingAthleteAssignment_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTrainingAthleteAssignment" ADD CONSTRAINT "RecurringTrainingAthleteAssignment_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "Trainer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTrainingTrainerAssignment" ADD CONSTRAINT "RecurringTrainingTrainerAssignment_recurringTrainingId_fkey" FOREIGN KEY ("recurringTrainingId") REFERENCES "RecurringTraining"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTrainingTrainerAssignment" ADD CONSTRAINT "RecurringTrainingTrainerAssignment_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTrainingTrainerAssignment" ADD CONSTRAINT "RecurringTrainingTrainerAssignment_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "Trainer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_recurringTrainingId_fkey" FOREIGN KEY ("recurringTrainingId") REFERENCES "RecurringTraining"("id") ON DELETE SET NULL ON UPDATE CASCADE;
