-- AlterEnum
ALTER TYPE "RecurrenceInterval" ADD VALUE 'ONCE';

-- AlterTable
ALTER TABLE "RecurringTraining" ADD COLUMN     "validFrom" TIMESTAMP(3),
ADD COLUMN     "validUntil" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "RecurringTraining_validFrom_validUntil_idx" ON "RecurringTraining"("validFrom", "validUntil");
