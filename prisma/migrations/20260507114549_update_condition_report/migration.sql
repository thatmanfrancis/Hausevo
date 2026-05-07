/*
  Warnings:

  - You are about to drop the column `isAcknowledged` on the `ConditionReport` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ConditionReportType" AS ENUM ('MOVE_IN', 'MOVE_OUT');

-- AlterTable
ALTER TABLE "ConditionReport" DROP COLUMN "isAcknowledged",
ADD COLUMN     "claimedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "isAcknowledgedByOwner" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isAcknowledgedByTenant" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" "ConditionReportType" NOT NULL DEFAULT 'MOVE_IN';
