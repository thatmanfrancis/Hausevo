-- CreateEnum
CREATE TYPE "GuarantorStatus" AS ENUM ('PENDING', 'ACKNOWLEDGED', 'DECLINED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "employerName" TEXT,
ADD COLUMN     "employmentStatus" TEXT,
ADD COLUMN     "idDocumentUrl" TEXT,
ADD COLUMN     "monthlyIncome" TEXT,
ADD COLUMN     "profession" TEXT,
ADD COLUMN     "selfieUrl" TEXT;

-- CreateTable
CREATE TABLE "Guarantor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "GuarantorStatus" NOT NULL DEFAULT 'PENDING',
    "isEmergency" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Guarantor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Guarantor_token_key" ON "Guarantor"("token");

-- CreateIndex
CREATE INDEX "Guarantor_userId_idx" ON "Guarantor"("userId");

-- CreateIndex
CREATE INDEX "Guarantor_token_idx" ON "Guarantor"("token");

-- AddForeignKey
ALTER TABLE "Guarantor" ADD CONSTRAINT "Guarantor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guarantor" ADD CONSTRAINT "Guarantor_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "TenancyApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
