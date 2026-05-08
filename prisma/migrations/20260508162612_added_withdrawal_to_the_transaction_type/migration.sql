-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'WITHDRAWAL';

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "actionUrl" TEXT;
