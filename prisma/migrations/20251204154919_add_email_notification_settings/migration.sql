-- AlterTable
ALTER TABLE "SystemSettings" ADD COLUMN     "emailAbsenceAlert" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailApprovalNotification" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailRegistrationNotification" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailSessionCancellation" BOOLEAN NOT NULL DEFAULT true;
