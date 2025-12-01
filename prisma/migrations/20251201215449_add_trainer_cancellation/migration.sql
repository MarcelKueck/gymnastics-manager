-- CreateTable
CREATE TABLE "TrainerCancellation" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "trainingSessionId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "cancelledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "undoneAt" TIMESTAMP(3),

    CONSTRAINT "TrainerCancellation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainerCancellation_trainerId_idx" ON "TrainerCancellation"("trainerId");

-- CreateIndex
CREATE INDEX "TrainerCancellation_trainingSessionId_idx" ON "TrainerCancellation"("trainingSessionId");

-- CreateIndex
CREATE INDEX "TrainerCancellation_isActive_idx" ON "TrainerCancellation"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TrainerCancellation_trainerId_trainingSessionId_key" ON "TrainerCancellation"("trainerId", "trainingSessionId");

-- AddForeignKey
ALTER TABLE "TrainerCancellation" ADD CONSTRAINT "TrainerCancellation_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerCancellation" ADD CONSTRAINT "TrainerCancellation_trainingSessionId_fkey" FOREIGN KEY ("trainingSessionId") REFERENCES "TrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
