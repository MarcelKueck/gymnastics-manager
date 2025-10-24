-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL,
    "cancellationDeadlineHours" INTEGER NOT NULL DEFAULT 2,
    "absenceAlertThreshold" INTEGER NOT NULL DEFAULT 3,
    "absenceAlertWindowDays" INTEGER NOT NULL DEFAULT 30,
    "absenceAlertCooldownDays" INTEGER NOT NULL DEFAULT 14,
    "adminNotificationEmail" TEXT NOT NULL DEFAULT 'admin@svesting.de',
    "absenceAlertEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maxUploadSizeMB" INTEGER NOT NULL DEFAULT 10,
    "sessionGenerationDaysAhead" INTEGER NOT NULL DEFAULT 90,
    "lastModifiedBy" TEXT,
    "lastModifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbsenceAlert" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "absenceCount" INTEGER NOT NULL,
    "absencePeriodStart" TIMESTAMP(3) NOT NULL,
    "absencePeriodEnd" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailSentToAthlete" BOOLEAN NOT NULL DEFAULT false,
    "emailSentToAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbsenceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AbsenceAlert_athleteId_idx" ON "AbsenceAlert"("athleteId");

-- CreateIndex
CREATE INDEX "AbsenceAlert_sentAt_idx" ON "AbsenceAlert"("sentAt");

-- AddForeignKey
ALTER TABLE "SystemSettings" ADD CONSTRAINT "SystemSettings_lastModifiedBy_fkey" FOREIGN KEY ("lastModifiedBy") REFERENCES "Trainer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsenceAlert" ADD CONSTRAINT "AbsenceAlert_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;
