-- CreateEnum
CREATE TYPE "AthleteStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "AthleteProfile" ADD COLUMN     "status" "AthleteStatus" NOT NULL DEFAULT 'PENDING';
