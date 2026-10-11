-- AlterTable
ALTER TABLE "Collection" ADD COLUMN "genres" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
