-- CreateEnum
CREATE TYPE "JointSavingsStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'BROKEN');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('NIN', 'Passport', 'WorkID', 'BankStatement');

-- CreateEnum
CREATE TYPE "DocStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "JointSavings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "currentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "status" "JointSavingsStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JointSavings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavingsContribution" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,
    "jointSavingsId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavingsContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVault" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "docType" "DocType" NOT NULL,
    "status" "DocStatus" NOT NULL DEFAULT 'PENDING',
    "fileUrl" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVault_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_JointSavingsMembers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_JointSavingsMembers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "SavingsContribution_userId_idx" ON "SavingsContribution"("userId");

-- CreateIndex
CREATE INDEX "SavingsContribution_jointSavingsId_idx" ON "SavingsContribution"("jointSavingsId");

-- CreateIndex
CREATE INDEX "DocumentVault_userId_idx" ON "DocumentVault"("userId");

-- CreateIndex
CREATE INDEX "_JointSavingsMembers_B_index" ON "_JointSavingsMembers"("B");

-- AddForeignKey
ALTER TABLE "SavingsContribution" ADD CONSTRAINT "SavingsContribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsContribution" ADD CONSTRAINT "SavingsContribution_jointSavingsId_fkey" FOREIGN KEY ("jointSavingsId") REFERENCES "JointSavings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVault" ADD CONSTRAINT "DocumentVault_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JointSavingsMembers" ADD CONSTRAINT "_JointSavingsMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "JointSavings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JointSavingsMembers" ADD CONSTRAINT "_JointSavingsMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
