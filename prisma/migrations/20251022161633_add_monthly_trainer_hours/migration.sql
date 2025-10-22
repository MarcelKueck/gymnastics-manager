-- CreateTable
CREATE TABLE "MonthlyTrainerSummary" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "trainerId" TEXT NOT NULL,
    "calculatedHours" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "adjustedHours" DECIMAL(10,2),
    "finalHours" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "lastModifiedBy" TEXT,
    "lastModifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyTrainerSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MonthlyTrainerSummary_month_year_idx" ON "MonthlyTrainerSummary"("month", "year");

-- CreateIndex
CREATE INDEX "MonthlyTrainerSummary_trainerId_idx" ON "MonthlyTrainerSummary"("trainerId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyTrainerSummary_trainerId_month_year_key" ON "MonthlyTrainerSummary"("trainerId", "month", "year");

-- AddForeignKey
ALTER TABLE "MonthlyTrainerSummary" ADD CONSTRAINT "MonthlyTrainerSummary_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyTrainerSummary" ADD CONSTRAINT "MonthlyTrainerSummary_lastModifiedBy_fkey" FOREIGN KEY ("lastModifiedBy") REFERENCES "Trainer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
