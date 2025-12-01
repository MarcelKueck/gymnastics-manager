-- CreateTable
CREATE TABLE "TrainerAttendanceRecord" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "trainingSessionId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "markedBy" TEXT NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastModifiedBy" TEXT,
    "lastModifiedAt" TIMESTAMP(3),
    "modificationReason" TEXT,
    "notes" TEXT,

    CONSTRAINT "TrainerAttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainerAttendanceRecord_trainerId_idx" ON "TrainerAttendanceRecord"("trainerId");

-- CreateIndex
CREATE INDEX "TrainerAttendanceRecord_trainingSessionId_idx" ON "TrainerAttendanceRecord"("trainingSessionId");

-- CreateIndex
CREATE INDEX "TrainerAttendanceRecord_status_idx" ON "TrainerAttendanceRecord"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TrainerAttendanceRecord_trainerId_trainingSessionId_key" ON "TrainerAttendanceRecord"("trainerId", "trainingSessionId");

-- AddForeignKey
ALTER TABLE "TrainerAttendanceRecord" ADD CONSTRAINT "TrainerAttendanceRecord_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerAttendanceRecord" ADD CONSTRAINT "TrainerAttendanceRecord_trainingSessionId_fkey" FOREIGN KEY ("trainingSessionId") REFERENCES "TrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerAttendanceRecord" ADD CONSTRAINT "TrainerAttendanceRecord_markedBy_fkey" FOREIGN KEY ("markedBy") REFERENCES "TrainerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
