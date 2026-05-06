-- CreateEnum
CREATE TYPE "ManagementStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "DevelopmentStage" AS ENUM ('LAND', 'FOUNDATION', 'CARCASS', 'FINISHED');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'PAID');

-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('PENDING', 'SIGNED', 'EXPIRED', 'TERMINATED');

-- AlterEnum
ALTER TYPE "TransactionStatus" ADD VALUE 'COMPLETED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'CAUTION_DEPOSIT';
ALTER TYPE "TransactionType" ADD VALUE 'MORTGAGE_REPAYMENT';
ALTER TYPE "TransactionType" ADD VALUE 'MANAGEMENT_FEE';
ALTER TYPE "TransactionType" ADD VALUE 'MILESTONE_PAYMENT';
ALTER TYPE "TransactionType" ADD VALUE 'LEASE_PAYMENT';

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "developmentStage" "DevelopmentStage" NOT NULL DEFAULT 'FINISHED',
ADD COLUMN     "isOffPlan" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "description" TEXT,
ADD COLUMN     "fromId" TEXT,
ADD COLUMN     "propertyId" TEXT,
ADD COLUMN     "tenancyId" TEXT,
ADD COLUMN     "toId" TEXT,
ALTER COLUMN "netAmount" SET DEFAULT 0,
ALTER COLUMN "shackFee" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "PropertyManagement" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "status" "ManagementStatus" NOT NULL DEFAULT 'ACTIVE',
    "canChat" BOOLEAN NOT NULL DEFAULT true,
    "canApproveTenants" BOOLEAN NOT NULL DEFAULT false,
    "canManageArtisans" BOOLEAN NOT NULL DEFAULT true,
    "canViewFinances" BOOLEAN NOT NULL DEFAULT false,
    "commissionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "fixedCommission" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyManagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancingOption" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "interestRate" DOUBLE PRECISION NOT NULL,
    "tenureYears" INTEGER NOT NULL,
    "minDownPayment" DOUBLE PRECISION NOT NULL,
    "isNHFEligible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancingOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "order" INTEGER NOT NULL DEFAULT 0,
    "inspectionId" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenancyAgreement" (
    "id" TEXT NOT NULL,
    "tenancyId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "ownerSigned" BOOLEAN NOT NULL DEFAULT false,
    "ownerSignedAt" TIMESTAMP(3),
    "tenantSigned" BOOLEAN NOT NULL DEFAULT false,
    "tenantSignedAt" TIMESTAMP(3),
    "status" "AgreementStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenancyAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PropertyManagement_propertyId_managerId_key" ON "PropertyManagement"("propertyId", "managerId");

-- CreateIndex
CREATE UNIQUE INDEX "TenancyAgreement_tenancyId_key" ON "TenancyAgreement"("tenancyId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_tenancyId_fkey" FOREIGN KEY ("tenancyId") REFERENCES "Tenancy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyManagement" ADD CONSTRAINT "PropertyManagement_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyManagement" ADD CONSTRAINT "PropertyManagement_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyManagement" ADD CONSTRAINT "PropertyManagement_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancingOption" ADD CONSTRAINT "FinancingOption_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenancyAgreement" ADD CONSTRAINT "TenancyAgreement_tenancyId_fkey" FOREIGN KEY ("tenancyId") REFERENCES "Tenancy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
