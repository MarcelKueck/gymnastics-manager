/*
  Warnings:

  - You are about to drop the `TrainingPlan` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."TrainingPlan" DROP CONSTRAINT "TrainingPlan_uploadedBy_fkey";

-- DropTable
DROP TABLE "public"."TrainingPlan";

-- DropEnum
DROP TYPE "public"."TrainingPlanCategory";

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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UploadCategory_name_key" ON "UploadCategory"("name");

-- CreateIndex
CREATE INDEX "UploadCategory_isActive_sortOrder_idx" ON "UploadCategory"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Upload_categoryId_idx" ON "Upload"("categoryId");

-- CreateIndex
CREATE INDEX "Upload_isActive_idx" ON "Upload"("isActive");

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "UploadCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "Trainer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
