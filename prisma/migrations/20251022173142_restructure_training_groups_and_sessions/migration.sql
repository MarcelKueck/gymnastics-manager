/*
Warnings:

- You are about to drop the column `groupNumber` on the `RecurringTraining` table. All the data in the column will be lost.
- You are about to drop the column `recurringTrainingId` on the `RecurringTrainingAthleteAssignment` table. All the data in the column will be lost.
- You are about to drop the column `recurringTrainingId` on the `RecurringTrainingTrainerAssignment` table. All the data in the column will be lost.
- You are about to drop the column `equipment1` on the `TrainingSession` table. All the data in the column will be lost.
- You are about to drop the column `equipment2` on the `TrainingSession` table. All the data in the column will be lost.
- You are about to drop the column `groupNumber` on the `TrainingSession` table. All the data in the column will be lost.
- A unique constraint covering the columns `[trainingGroupId,athleteId]` on the table `RecurringTrainingAthleteAssignment` will be added. If there are existing duplicate values, this will fail.
- A unique constraint covering the columns `[trainingGroupId,trainerId]` on the table `RecurringTrainingTrainerAssignment` will be added. If there are existing duplicate values, this will fail.
- Added the required column `trainingGroupId` to the `RecurringTrainingAthleteAssignment` table without a default value. This is not possible if the table is not empty.
- Added the required column `trainingGroupId` to the `RecurringTrainingTrainerAssignment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."RecurringTrainingAthleteAssignment" DROP CONSTRAINT "RecurringTrainingAthleteAssignment_recurringTrainingId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RecurringTrainingTrainerAssignment" DROP CONSTRAINT "RecurringTrainingTrainerAssignment_recurringTrainingId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TrainerSessionAssignment" DROP CONSTRAINT "TrainerSessionAssignment_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TrainerSessionAssignment" DROP CONSTRAINT "TrainerSessionAssignment_trainerId_fkey";

-- DropIndex
DROP INDEX "public"."RecurringTrainingAthleteAssignment_recurringTrainingId_athl_key";

-- DropIndex
DROP INDEX "public"."RecurringTrainingAthleteAssignment_recurringTrainingId_idx";

-- DropIndex
DROP INDEX "public"."RecurringTrainingTrainerAssignment_recurringTrainingId_idx";

-- DropIndex
DROP INDEX "public"."RecurringTrainingTrainerAssignment_recurringTrainingId_trai_key";

-- DropIndex
DROP INDEX "public"."TrainingSession_dayOfWeek_groupNumber_idx";

-- Step 1: Create TrainingGroup table first
CREATE TABLE "TrainingGroup" (
    "id" TEXT NOT NULL,
    "recurringTrainingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TrainingGroup_pkey" PRIMARY KEY ("id")
);

-- Step 2: Migrate existing RecurringTraining data to TrainingGroups
-- For each RecurringTraining with a groupNumber, create a corresponding TrainingGroup
INSERT INTO "TrainingGroup" ("id", "recurringTrainingId", "name", "description", "sortOrder", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text as id,
    id as recurringTrainingId,
    'Gruppe ' || "groupNumber" as name,
    NULL as description,
    "groupNumber" as sortOrder,
    CURRENT_TIMESTAMP as createdAt,
    CURRENT_TIMESTAMP as updatedAt
FROM "RecurringTraining";

-- Step 3: Add temporary column to store the mapping
ALTER TABLE "RecurringTrainingAthleteAssignment"
ADD COLUMN "trainingGroupId" TEXT;

ALTER TABLE "RecurringTrainingTrainerAssignment"
ADD COLUMN "trainingGroupId" TEXT;

-- Step 4: Update athlete assignments to reference the new TrainingGroup
UPDATE "RecurringTrainingAthleteAssignment" raa
SET "trainingGroupId" = tg.id
FROM "TrainingGroup" tg
WHERE raa."recurringTrainingId" = tg."recurringTrainingId";

-- Step 5: Update trainer assignments to reference the new TrainingGroup
UPDATE "RecurringTrainingTrainerAssignment" rta
SET "trainingGroupId" = tg.id
FROM "TrainingGroup" tg
WHERE rta."recurringTrainingId" = tg."recurringTrainingId";

-- Step 6: Make trainingGroupId NOT NULL after data is migrated
ALTER TABLE "RecurringTrainingAthleteAssignment"
ALTER COLUMN "trainingGroupId"
SET
    NOT NULL;

ALTER TABLE "RecurringTrainingTrainerAssignment"
ALTER COLUMN "trainingGroupId"
SET
    NOT NULL;

-- Step 7: Now drop the old columns
ALTER TABLE "RecurringTraining" DROP COLUMN "groupNumber";

ALTER TABLE "RecurringTrainingAthleteAssignment"
DROP COLUMN "recurringTrainingId";

ALTER TABLE "RecurringTrainingTrainerAssignment"
DROP COLUMN "recurringTrainingId";

-- Step 8: Handle TrainingSession migration
-- Store equipment in notes temporarily, then drop columns
UPDATE "TrainingSession"
SET
    "notes" = CONCAT_WS(
        chr (10),
        CASE
            WHEN "equipment1" IS NOT NULL THEN 'Gerät 1: ' || "equipment1"
            ELSE NULL
        END,
        CASE
            WHEN "equipment2" IS NOT NULL THEN 'Gerät 2: ' || "equipment2"
            ELSE NULL
        END,
        "notes"
    )
WHERE
    "equipment1" IS NOT NULL
    OR "equipment2" IS NOT NULL;

ALTER TABLE "TrainingSession" DROP COLUMN "equipment1";

ALTER TABLE "TrainingSession" DROP COLUMN "equipment2";

ALTER TABLE "TrainingSession" DROP COLUMN "groupNumber";

-- Step 9: Create remaining tables

-- CreateTable
CREATE TABLE "SessionGroup" (
    "id" TEXT NOT NULL,
    "trainingSessionId" TEXT NOT NULL,
    "trainingGroupId" TEXT NOT NULL,
    "exercises" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SessionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionGroupTrainerAssignment" (
    "id" TEXT NOT NULL,
    "sessionGroupId" TEXT NOT NULL,
    "trainerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SessionGroupTrainerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionAthleteAssignment" (
    "id" TEXT NOT NULL,
    "trainingSessionId" TEXT NOT NULL,
    "sessionGroupId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "movedBy" TEXT NOT NULL,
    "movedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SessionAthleteAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingGroup_recurringTrainingId_idx" ON "TrainingGroup" ("recurringTrainingId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingGroup_recurringTrainingId_name_key" ON "TrainingGroup" ("recurringTrainingId", "name");

-- CreateIndex
CREATE INDEX "SessionGroup_trainingSessionId_idx" ON "SessionGroup" ("trainingSessionId");

-- CreateIndex
CREATE INDEX "SessionGroup_trainingGroupId_idx" ON "SessionGroup" ("trainingGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionGroup_trainingSessionId_trainingGroupId_key" ON "SessionGroup" (
    "trainingSessionId",
    "trainingGroupId"
);

-- CreateIndex
CREATE INDEX "SessionGroupTrainerAssignment_sessionGroupId_idx" ON "SessionGroupTrainerAssignment" ("sessionGroupId");

-- CreateIndex
CREATE INDEX "SessionGroupTrainerAssignment_trainerId_idx" ON "SessionGroupTrainerAssignment" ("trainerId");

-- CreateIndex
CREATE INDEX "SessionAthleteAssignment_trainingSessionId_idx" ON "SessionAthleteAssignment" ("trainingSessionId");

-- CreateIndex
CREATE INDEX "SessionAthleteAssignment_sessionGroupId_idx" ON "SessionAthleteAssignment" ("sessionGroupId");

-- CreateIndex
CREATE INDEX "SessionAthleteAssignment_athleteId_idx" ON "SessionAthleteAssignment" ("athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionAthleteAssignment_trainingSessionId_athleteId_key" ON "SessionAthleteAssignment" (
    "trainingSessionId",
    "athleteId"
);

-- CreateIndex
CREATE INDEX "Athlete_birthDate_idx" ON "Athlete" ("birthDate");

-- CreateIndex
CREATE INDEX "RecurringTrainingAthleteAssignment_trainingGroupId_idx" ON "RecurringTrainingAthleteAssignment" ("trainingGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringTrainingAthleteAssignment_trainingGroupId_athleteI_key" ON "RecurringTrainingAthleteAssignment" (
    "trainingGroupId",
    "athleteId"
);

-- CreateIndex
CREATE INDEX "RecurringTrainingTrainerAssignment_trainingGroupId_idx" ON "RecurringTrainingTrainerAssignment" ("trainingGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringTrainingTrainerAssignment_trainingGroupId_trainerI_key" ON "RecurringTrainingTrainerAssignment" (
    "trainingGroupId",
    "trainerId"
);

-- CreateIndex
CREATE INDEX "TrainingSession_dayOfWeek_idx" ON "TrainingSession" ("dayOfWeek");

-- AddForeignKey
ALTER TABLE "TrainingGroup"
ADD CONSTRAINT "TrainingGroup_recurringTrainingId_fkey" FOREIGN KEY ("recurringTrainingId") REFERENCES "RecurringTraining" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTrainingAthleteAssignment"
ADD CONSTRAINT "RecurringTrainingAthleteAssignment_trainingGroupId_fkey" FOREIGN KEY ("trainingGroupId") REFERENCES "TrainingGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTrainingTrainerAssignment"
ADD CONSTRAINT "RecurringTrainingTrainerAssignment_trainingGroupId_fkey" FOREIGN KEY ("trainingGroupId") REFERENCES "TrainingGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionGroup"
ADD CONSTRAINT "SessionGroup_trainingSessionId_fkey" FOREIGN KEY ("trainingSessionId") REFERENCES "TrainingSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionGroup"
ADD CONSTRAINT "SessionGroup_trainingGroupId_fkey" FOREIGN KEY ("trainingGroupId") REFERENCES "TrainingGroup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionGroupTrainerAssignment"
ADD CONSTRAINT "SessionGroupTrainerAssignment_sessionGroupId_fkey" FOREIGN KEY ("sessionGroupId") REFERENCES "SessionGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionGroupTrainerAssignment"
ADD CONSTRAINT "SessionGroupTrainerAssignment_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionAthleteAssignment"
ADD CONSTRAINT "SessionAthleteAssignment_trainingSessionId_fkey" FOREIGN KEY ("trainingSessionId") REFERENCES "TrainingSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionAthleteAssignment"
ADD CONSTRAINT "SessionAthleteAssignment_sessionGroupId_fkey" FOREIGN KEY ("sessionGroupId") REFERENCES "SessionGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionAthleteAssignment"
ADD CONSTRAINT "SessionAthleteAssignment_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionAthleteAssignment"
ADD CONSTRAINT "SessionAthleteAssignment_movedBy_fkey" FOREIGN KEY ("movedBy") REFERENCES "Trainer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 10: Create SessionGroups for existing TrainingSessions
-- For each existing TrainingSession, create a SessionGroup linked to its TrainingGroup
INSERT INTO "SessionGroup" ("id", "trainingSessionId", "trainingGroupId", "exercises", "notes", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text as id,
    ts.id as trainingSessionId,
    tg.id as trainingGroupId,
    NULL as exercises,
    NULL as notes,
    CURRENT_TIMESTAMP as createdAt,
    CURRENT_TIMESTAMP as updatedAt
FROM "TrainingSession" ts
INNER JOIN "TrainingGroup" tg ON ts."recurringTrainingId" = tg."recurringTrainingId"
WHERE ts."recurringTrainingId" IS NOT NULL;

-- Step 11: Migrate trainer assignments from TrainerSessionAssignment to SessionGroupTrainerAssignment
-- This assumes the old system had trainers assigned to entire sessions, now we assign them to session groups
INSERT INTO "SessionGroupTrainerAssignment" ("id", "sessionGroupId", "trainerId", "createdAt")
SELECT 
    gen_random_uuid()::text as id,
    sg.id as sessionGroupId,
    tsa."trainerId",
    CURRENT_TIMESTAMP as createdAt
FROM "TrainerSessionAssignment" tsa
INNER JOIN "SessionGroup" sg ON sg."trainingSessionId" = tsa."sessionId"
WHERE EXISTS (
    SELECT 1 FROM "TrainingSession" ts WHERE ts.id = tsa."sessionId"
);

-- Step 12: Drop old foreign key constraints from TrainerSessionAssignment (already done above)
-- The TrainerSessionAssignment table is now deprecated but kept for reference