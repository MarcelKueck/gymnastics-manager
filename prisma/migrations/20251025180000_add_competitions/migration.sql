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
    "entryFee" DECIMAL(10, 2),
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
    "score" DECIMAL(10, 2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompetitionRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Competition_date_idx" ON "Competition" ("date");

-- CreateIndex
CREATE INDEX "Competition_isPublished_idx" ON "Competition" ("isPublished");

-- CreateIndex
CREATE INDEX "CompetitionRegistration_competitionId_idx" ON "CompetitionRegistration" ("competitionId");

-- CreateIndex
CREATE INDEX "CompetitionRegistration_athleteId_idx" ON "CompetitionRegistration" ("athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionRegistration_competitionId_athleteId_key" ON "CompetitionRegistration" ("competitionId", "athleteId");

-- AddForeignKey
ALTER TABLE "Competition"
ADD CONSTRAINT "Competition_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "TrainerProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionRegistration"
ADD CONSTRAINT "CompetitionRegistration_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionRegistration"
ADD CONSTRAINT "CompetitionRegistration_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE;