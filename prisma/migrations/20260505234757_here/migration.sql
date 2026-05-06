-- AlterEnum
ALTER TYPE "RentFrequency" ADD VALUE 'MONTHLY';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
