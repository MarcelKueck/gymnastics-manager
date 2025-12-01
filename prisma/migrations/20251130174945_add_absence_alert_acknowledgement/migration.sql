-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ATHLETE', 'TRAINER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "YouthCategory" AS ENUM ('F', 'E', 'D');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "RecurrenceInterval" AS ENUM ('ONCE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT_UNEXCUSED', 'ABSENT_EXCUSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "gender" "Gender",
    "isAthlete" BOOLEAN NOT NULL DEFAULT false,
    "isTrainer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AthleteProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "guardianName" TEXT,
    "guardianEmail" TEXT,
    "guardianPhone" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "youthCategory" "YouthCategory" NOT NULL DEFAULT 'F',
    "competitionParticipation" BOOLEAN NOT NULL DEFAULT false,
    "hasDtbId" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "configuredAt" TIMESTAMP(3),
    "autoConfirmFutureSessions" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AthleteProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'TRAINER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringTraining" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "recurrence" "RecurrenceInterval" NOT NULL DEFAULT 'WEEKLY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringTraining_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingGroup" (
    "id" TEXT NOT NULL,
    "recurringTrainingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringTrainingAthleteAssignment" (
    "id" TEXT NOT NULL,
    "trainingGroupId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecurringTrainingAthleteAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringTrainingTrainerAssignment" (
    "id" TEXT NOT NULL,
    "trainingGroupId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveUntil" TIMESTAMP(3),
    "assignedBy" TEXT NOT NULL,

    CONSTRAINT "RecurringTrainingTrainerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingSession" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "recurringTrainingId" TEXT,
    "notes" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "cancelledBy" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionGroup" (
    "id" TEXT NOT NULL,
    "trainingSessionId" TEXT NOT NULL,
    "trainingGroupId" TEXT NOT NULL,
    "exercises" TEXT,
    "notes" TEXT,

    CONSTRAINT "SessionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionGroupTrainerAssignment" (
    "id" TEXT NOT NULL,
    "sessionGroupId" TEXT NOT NULL,
    "trainerId" TEXT,

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

    CONSTRAINT "SessionAthleteAssignment_pkey" PRIMARY KEY ("id")
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

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT,
    "minYouthCategory" "YouthCategory",
    "maxYouthCategory" "YouthCategory",
    "registrationDeadline" TIMESTAMP(3),
    "maxParticipants" INTEGER,
    "requiresDtbId" BOOLEAN NOT NULL DEFAULT false,
    "entryFee" DECIMAL(10,2),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionRegistration" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "attended" BOOLEAN,
    "placement" INTEGER,
    "score" DECIMAL(10,2),

    CONSTRAINT "CompetitionRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UploadCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Upload" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
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

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "cancellationDeadlineHours" INTEGER NOT NULL DEFAULT 2,
    "absenceAlertThreshold" INTEGER NOT NULL DEFAULT 3,
    "absenceAlertWindowDays" INTEGER NOT NULL DEFAULT 30,
    "absenceAlertCooldownDays" INTEGER NOT NULL DEFAULT 14,
    "adminNotificationEmail" TEXT NOT NULL DEFAULT '',
    "absenceAlertEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maxUploadSizeMB" INTEGER NOT NULL DEFAULT 10,
    "sessionGenerationDaysAhead" INTEGER NOT NULL DEFAULT 90,
    "lastModifiedBy" TEXT,
    "lastModifiedAt" TIMESTAMP(3),

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbsenceAlert" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "absenceCount" INTEGER NOT NULL,
    "period" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,

    CONSTRAINT "AbsenceAlert_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "MonthlyTrainerSummary" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "trainerId" TEXT NOT NULL,
    "calculatedHours" DECIMAL(10,2) NOT NULL,
    "adjustedHours" DECIMAL(10,2),
    "finalHours" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "lastModifiedBy" TEXT,
    "lastModifiedAt" TIMESTAMP(3),

    CONSTRAINT "MonthlyTrainerSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_isAthlete_isTrainer_idx" ON "User"("isAthlete", "isTrainer");

-- CreateIndex
CREATE UNIQUE INDEX "AthleteProfile_userId_key" ON "AthleteProfile"("userId");

-- CreateIndex
CREATE INDEX "AthleteProfile_userId_idx" ON "AthleteProfile"("userId");

-- CreateIndex
CREATE INDEX "AthleteProfile_isApproved_idx" ON "AthleteProfile"("isApproved");

-- CreateIndex
CREATE INDEX "AthleteProfile_youthCategory_idx" ON "AthleteProfile"("youthCategory");

-- CreateIndex
CREATE UNIQUE INDEX "TrainerProfile_userId_key" ON "TrainerProfile"("userId");

-- CreateIndex
CREATE INDEX "TrainerProfile_userId_idx" ON "TrainerProfile"("userId");

-- CreateIndex
CREATE INDEX "TrainerProfile_role_idx" ON "TrainerProfile"("role");

-- CreateIndex
CREATE INDEX "TrainerProfile_isActive_idx" ON "TrainerProfile"("isActive");

-- CreateIndex
CREATE INDEX "RecurringTraining_dayOfWeek_idx" ON "RecurringTraining"("dayOfWeek");

-- CreateIndex
CREATE INDEX "RecurringTraining_isActive_idx" ON "RecurringTraining"("isActive");

-- CreateIndex
CREATE INDEX "TrainingGroup_recurringTrainingId_idx" ON "TrainingGroup"("recurringTrainingId");

-- CreateIndex
CREATE INDEX "RecurringTrainingAthleteAssignment_trainingGroupId_idx" ON "RecurringTrainingAthleteAssignment"("trainingGroupId");

-- CreateIndex
CREATE INDEX "RecurringTrainingAthleteAssignment_athleteId_idx" ON "RecurringTrainingAthleteAssignment"("athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringTrainingAthleteAssignment_trainingGroupId_athleteI_key" ON "RecurringTrainingAthleteAssignment"("trainingGroupId", "athleteId");

-- CreateIndex
CREATE INDEX "RecurringTrainingTrainerAssignment_trainingGroupId_idx" ON "RecurringTrainingTrainerAssignment"("trainingGroupId");

-- CreateIndex
CREATE INDEX "RecurringTrainingTrainerAssignment_trainerId_idx" ON "RecurringTrainingTrainerAssignment"("trainerId");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringTrainingTrainerAssignment_trainingGroupId_trainerI_key" ON "RecurringTrainingTrainerAssignment"("trainingGroupId", "trainerId");

-- CreateIndex
CREATE INDEX "TrainingSession_date_idx" ON "TrainingSession"("date");

-- CreateIndex
CREATE INDEX "TrainingSession_recurringTrainingId_idx" ON "TrainingSession"("recurringTrainingId");

-- CreateIndex
CREATE INDEX "TrainingSession_isCancelled_idx" ON "TrainingSession"("isCancelled");

-- CreateIndex
CREATE INDEX "SessionGroup_trainingSessionId_idx" ON "SessionGroup"("trainingSessionId");

-- CreateIndex
CREATE INDEX "SessionGroup_trainingGroupId_idx" ON "SessionGroup"("trainingGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionGroup_trainingSessionId_trainingGroupId_key" ON "SessionGroup"("trainingSessionId", "trainingGroupId");

-- CreateIndex
CREATE INDEX "SessionGroupTrainerAssignment_sessionGroupId_idx" ON "SessionGroupTrainerAssignment"("sessionGroupId");

-- CreateIndex
CREATE INDEX "SessionGroupTrainerAssignment_trainerId_idx" ON "SessionGroupTrainerAssignment"("trainerId");

-- CreateIndex
CREATE INDEX "SessionAthleteAssignment_trainingSessionId_idx" ON "SessionAthleteAssignment"("trainingSessionId");

-- CreateIndex
CREATE INDEX "SessionAthleteAssignment_athleteId_idx" ON "SessionAthleteAssignment"("athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionAthleteAssignment_trainingSessionId_athleteId_key" ON "SessionAthleteAssignment"("trainingSessionId", "athleteId");

-- CreateIndex
CREATE INDEX "Cancellation_athleteId_idx" ON "Cancellation"("athleteId");

-- CreateIndex
CREATE INDEX "Cancellation_trainingSessionId_idx" ON "Cancellation"("trainingSessionId");

-- CreateIndex
CREATE INDEX "Cancellation_isActive_idx" ON "Cancellation"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Cancellation_athleteId_trainingSessionId_key" ON "Cancellation"("athleteId", "trainingSessionId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_athleteId_idx" ON "AttendanceRecord"("athleteId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_trainingSessionId_idx" ON "AttendanceRecord"("trainingSessionId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_status_idx" ON "AttendanceRecord"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_athleteId_trainingSessionId_key" ON "AttendanceRecord"("athleteId", "trainingSessionId");

-- CreateIndex
CREATE INDEX "Competition_date_idx" ON "Competition"("date");

-- CreateIndex
CREATE INDEX "Competition_isPublished_idx" ON "Competition"("isPublished");

-- CreateIndex
CREATE INDEX "CompetitionRegistration_competitionId_idx" ON "CompetitionRegistration"("competitionId");

-- CreateIndex
CREATE INDEX "CompetitionRegistration_athleteId_idx" ON "CompetitionRegistration"("athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionRegistration_competitionId_athleteId_key" ON "CompetitionRegistration"("competitionId", "athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "UploadCategory_name_key" ON "UploadCategory"("name");

-- CreateIndex
CREATE INDEX "Upload_categoryId_idx" ON "Upload"("categoryId");

-- CreateIndex
CREATE INDEX "Upload_isActive_idx" ON "Upload"("isActive");

-- CreateIndex
CREATE INDEX "AbsenceAlert_athleteId_idx" ON "AbsenceAlert"("athleteId");

-- CreateIndex
CREATE INDEX "AbsenceAlert_createdAt_idx" ON "AbsenceAlert"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_performedBy_idx" ON "AuditLog"("performedBy");

-- CreateIndex
CREATE INDEX "AuditLog_performedAt_idx" ON "AuditLog"("performedAt");

-- CreateIndex
CREATE INDEX "MonthlyTrainerSummary_trainerId_idx" ON "MonthlyTrainerSummary"("trainerId");

-- CreateIndex
CREATE INDEX "MonthlyTrainerSummary_year_month_idx" ON "MonthlyTrainerSummary"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyTrainerSummary_month_year_trainerId_key" ON "MonthlyTrainerSummary"("month", "year", "trainerId");

-- AddForeignKey
ALTER TABLE "AthleteProfile" ADD CONSTRAINT "AthleteProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteProfile" ADD CONSTRAINT "AthleteProfile_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "TrainerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerProfile" ADD CONSTRAINT "TrainerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTraining" ADD CONSTRAINT "RecurringTraining_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "TrainerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingGroup" ADD CONSTRAINT "TrainingGroup_recurringTrainingId_fkey" FOREIGN KEY ("recurringTrainingId") REFERENCES "RecurringTraining"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTrainingAthleteAssignment" ADD CONSTRAINT "RecurringTrainingAthleteAssignment_trainingGroupId_fkey" FOREIGN KEY ("trainingGroupId") REFERENCES "TrainingGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTrainingAthleteAssignment" ADD CONSTRAINT "RecurringTrainingAthleteAssignment_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTrainingAthleteAssignment" ADD CONSTRAINT "RecurringTrainingAthleteAssignment_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "TrainerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTrainingTrainerAssignment" ADD CONSTRAINT "RecurringTrainingTrainerAssignment_trainingGroupId_fkey" FOREIGN KEY ("trainingGroupId") REFERENCES "TrainingGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTrainingTrainerAssignment" ADD CONSTRAINT "RecurringTrainingTrainerAssignment_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTrainingTrainerAssignment" ADD CONSTRAINT "RecurringTrainingTrainerAssignment_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "TrainerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_recurringTrainingId_fkey" FOREIGN KEY ("recurringTrainingId") REFERENCES "RecurringTraining"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_cancelledBy_fkey" FOREIGN KEY ("cancelledBy") REFERENCES "TrainerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionGroup" ADD CONSTRAINT "SessionGroup_trainingSessionId_fkey" FOREIGN KEY ("trainingSessionId") REFERENCES "TrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionGroup" ADD CONSTRAINT "SessionGroup_trainingGroupId_fkey" FOREIGN KEY ("trainingGroupId") REFERENCES "TrainingGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionGroupTrainerAssignment" ADD CONSTRAINT "SessionGroupTrainerAssignment_sessionGroupId_fkey" FOREIGN KEY ("sessionGroupId") REFERENCES "SessionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionGroupTrainerAssignment" ADD CONSTRAINT "SessionGroupTrainerAssignment_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionAthleteAssignment" ADD CONSTRAINT "SessionAthleteAssignment_trainingSessionId_fkey" FOREIGN KEY ("trainingSessionId") REFERENCES "TrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionAthleteAssignment" ADD CONSTRAINT "SessionAthleteAssignment_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionAthleteAssignment" ADD CONSTRAINT "SessionAthleteAssignment_movedBy_fkey" FOREIGN KEY ("movedBy") REFERENCES "TrainerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cancellation" ADD CONSTRAINT "Cancellation_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cancellation" ADD CONSTRAINT "Cancellation_trainingSessionId_fkey" FOREIGN KEY ("trainingSessionId") REFERENCES "TrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_trainingSessionId_fkey" FOREIGN KEY ("trainingSessionId") REFERENCES "TrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_markedBy_fkey" FOREIGN KEY ("markedBy") REFERENCES "TrainerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competition" ADD CONSTRAINT "Competition_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "TrainerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionRegistration" ADD CONSTRAINT "CompetitionRegistration_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionRegistration" ADD CONSTRAINT "CompetitionRegistration_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "UploadCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "TrainerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemSettings" ADD CONSTRAINT "SystemSettings_lastModifiedBy_fkey" FOREIGN KEY ("lastModifiedBy") REFERENCES "TrainerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsenceAlert" ADD CONSTRAINT "AbsenceAlert_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsenceAlert" ADD CONSTRAINT "AbsenceAlert_acknowledgedBy_fkey" FOREIGN KEY ("acknowledgedBy") REFERENCES "TrainerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "TrainerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyTrainerSummary" ADD CONSTRAINT "MonthlyTrainerSummary_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyTrainerSummary" ADD CONSTRAINT "MonthlyTrainerSummary_lastModifiedBy_fkey" FOREIGN KEY ("lastModifiedBy") REFERENCES "TrainerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
