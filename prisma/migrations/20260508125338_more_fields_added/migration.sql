-- AlterTable
ALTER TABLE "ArtisanProfile" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "startingPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "yearsOfExperience" INTEGER NOT NULL DEFAULT 0;
