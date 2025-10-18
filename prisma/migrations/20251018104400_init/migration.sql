-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ATHLETE', 'TRAINER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "YouthCategory" AS ENUM ('F', 'E', 'D');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'THURSDAY', 'FRIDAY');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT_UNEXCUSED', 'ABSENT_EXCUSED');

-- CreateEnum
CREATE TYPE "TrainingPlanCategory" AS ENUM ('STRENGTH_GOALS', 'STRENGTH_EXERCISES', 'STRETCHING_GOALS', 'STRETCHING_EXERCISES');

-- CreateTable
CREATE TABLE "Athlete" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL,
    "phone" TEXT NOT NULL,
    "guardianName" TEXT,
    "guardianEmail" TEXT,
    "guardianPhone" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "youthCategory" "YouthCategory" NOT NULL DEFAULT 'F',
    "competitionParticipation" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "configuredAt" TIMESTAMP(3),
    "autoConfirmFutureSessions" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Athlete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trainer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'TRAINER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AthleteGroupAssignment" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "groupNumber" INTEGER NOT NULL,
    "hourNumber" INTEGER NOT NULL,
    "trainingDay" "DayOfWeek" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AthleteGroupAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingSession" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "hourNumber" INTEGER NOT NULL,
    "groupNumber" INTEGER NOT NULL,
    "equipment1" TEXT,
    "equipment2" TEXT,
    "notes" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainerSessionAssignment" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainerSessionAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cancellation" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "trainingSessionId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "cancelledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "undoneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cancellation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "trainingSessionId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "markedBy" TEXT NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastModifiedBy" TEXT,
    "lastModifiedAt" TIMESTAMP(3),
    "modificationReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingPlan" (
    "id" TEXT NOT NULL,
    "category" "TrainingPlanCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "targetDate" TEXT,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "replacedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "performedBy" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Athlete_email_key" ON "Athlete"("email");

-- CreateIndex
CREATE INDEX "Athlete_email_idx" ON "Athlete"("email");

-- CreateIndex
CREATE INDEX "Athlete_isApproved_idx" ON "Athlete"("isApproved");

-- CreateIndex
CREATE INDEX "Athlete_lastName_idx" ON "Athlete"("lastName");

-- CreateIndex
CREATE UNIQUE INDEX "Trainer_email_key" ON "Trainer"("email");

-- CreateIndex
CREATE INDEX "Trainer_email_idx" ON "Trainer"("email");

-- CreateIndex
CREATE INDEX "Trainer_role_idx" ON "Trainer"("role");

-- CreateIndex
CREATE INDEX "AthleteGroupAssignment_athleteId_idx" ON "AthleteGroupAssignment"("athleteId");

-- CreateIndex
CREATE INDEX "AthleteGroupAssignment_groupNumber_idx" ON "AthleteGroupAssignment"("groupNumber");

-- CreateIndex
CREATE INDEX "AthleteGroupAssignment_trainingDay_hourNumber_groupNumber_idx" ON "AthleteGroupAssignment"("trainingDay", "hourNumber", "groupNumber");

-- CreateIndex
CREATE INDEX "TrainingSession_date_idx" ON "TrainingSession"("date");

-- CreateIndex
CREATE INDEX "TrainingSession_dayOfWeek_hourNumber_groupNumber_idx" ON "TrainingSession"("dayOfWeek", "hourNumber", "groupNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingSession_date_dayOfWeek_hourNumber_groupNumber_key" ON "TrainingSession"("date", "dayOfWeek", "hourNumber", "groupNumber");

-- CreateIndex
CREATE INDEX "TrainerSessionAssignment_sessionId_idx" ON "TrainerSessionAssignment"("sessionId");

-- CreateIndex
CREATE INDEX "TrainerSessionAssignment_trainerId_idx" ON "TrainerSessionAssignment"("trainerId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainerSessionAssignment_trainerId_sessionId_key" ON "TrainerSessionAssignment"("trainerId", "sessionId");

-- CreateIndex
CREATE INDEX "Cancellation_athleteId_idx" ON "Cancellation"("athleteId");

-- CreateIndex
CREATE INDEX "Cancellation_trainingSessionId_idx" ON "Cancellation"("trainingSessionId");

-- CreateIndex
CREATE INDEX "Cancellation_cancelledAt_idx" ON "Cancellation"("cancelledAt");

-- CreateIndex
CREATE INDEX "AttendanceRecord_athleteId_idx" ON "AttendanceRecord"("athleteId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_trainingSessionId_idx" ON "AttendanceRecord"("trainingSessionId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_status_idx" ON "AttendanceRecord"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_athleteId_trainingSessionId_key" ON "AttendanceRecord"("athleteId", "trainingSessionId");

-- CreateIndex
CREATE INDEX "TrainingPlan_category_idx" ON "TrainingPlan"("category");

-- CreateIndex
CREATE INDEX "TrainingPlan_isActive_idx" ON "TrainingPlan"("isActive");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_performedAt_idx" ON "AuditLog"("performedAt");

-- CreateIndex
CREATE INDEX "AuditLog_performedBy_idx" ON "AuditLog"("performedBy");

-- AddForeignKey
ALTER TABLE "Athlete" ADD CONSTRAINT "Athlete_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "Trainer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteGroupAssignment" ADD CONSTRAINT "AthleteGroupAssignment_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteGroupAssignment" ADD CONSTRAINT "AthleteGroupAssignment_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "Trainer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerSessionAssignment" ADD CONSTRAINT "TrainerSessionAssignment_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerSessionAssignment" ADD CONSTRAINT "TrainerSessionAssignment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cancellation" ADD CONSTRAINT "Cancellation_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cancellation" ADD CONSTRAINT "Cancellation_trainingSessionId_fkey" FOREIGN KEY ("trainingSessionId") REFERENCES "TrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_trainingSessionId_fkey" FOREIGN KEY ("trainingSessionId") REFERENCES "TrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_markedBy_fkey" FOREIGN KEY ("markedBy") REFERENCES "Trainer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingPlan" ADD CONSTRAINT "TrainingPlan_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "Trainer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "Trainer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
