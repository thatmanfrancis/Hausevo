-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('RENT', 'SALE', 'LEASE', 'SHORTLET');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "listingType" "ListingType" NOT NULL DEFAULT 'RENT';
