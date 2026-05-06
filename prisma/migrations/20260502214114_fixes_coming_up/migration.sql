/*
  Warnings:

  - Added the required column `netAmount` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shackFee` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'VERIFICATION';
ALTER TYPE "TransactionType" ADD VALUE 'BOND_CONTRIBUTION';

-- AlterTable
ALTER TABLE "ArtisanProfile" ADD COLUMN     "bondAccumulated" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "bondTarget" DOUBLE PRECISION NOT NULL DEFAULT 30000.0,
ADD COLUMN     "currentCommission" DOUBLE PRECISION NOT NULL DEFAULT 20.0,
ADD COLUMN     "jobsCompleted" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "boostExpiresAt" TIMESTAMP(3),
ADD COLUMN     "boostLGA" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "companyRC" TEXT,
ADD COLUMN     "deedDocumentId" TEXT,
ADD COLUMN     "deedVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deedVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "deedVerifiedBy" TEXT,
ADD COLUMN     "inheritanceProof" TEXT,
ADD COLUMN     "institutionName" TEXT,
ADD COLUMN     "isBoosted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isCorporateOwned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isInherited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isInstitutional" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isProxySubmission" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "landlordConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "landlordContacted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "landlordEmail" TEXT,
ADD COLUMN     "landlordName" TEXT,
ADD COLUMN     "landlordPhone" TEXT,
ADD COLUMN     "priceVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priceVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "proxySubmitterId" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "netAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "shackFee" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accumulatedBond" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "vaultPremium" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vaultPremiumUntil" TIMESTAMP(3),
ADD COLUMN     "vaultStorageLimit" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "vaultStorageUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "verificationBundlePaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationBundlePaidAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "subject" TEXT NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "SupportTicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "relatedEntity" TEXT,
    "relatedEntityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_proxySubmitterId_fkey" FOREIGN KEY ("proxySubmitterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
