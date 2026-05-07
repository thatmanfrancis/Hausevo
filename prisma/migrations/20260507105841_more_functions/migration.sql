-- AlterTable
ALTER TABLE "AccessKey" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "receiptUrl" TEXT;

-- CreateTable
CREATE TABLE "ConditionReport" (
    "id" TEXT NOT NULL,
    "tenancyId" TEXT NOT NULL,
    "beforePhotos" TEXT[],
    "afterPhotos" TEXT[],
    "notes" TEXT,
    "isAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConditionReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConditionReport_tenancyId_key" ON "ConditionReport"("tenancyId");

-- AddForeignKey
ALTER TABLE "ConditionReport" ADD CONSTRAINT "ConditionReport_tenancyId_fkey" FOREIGN KEY ("tenancyId") REFERENCES "Tenancy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
