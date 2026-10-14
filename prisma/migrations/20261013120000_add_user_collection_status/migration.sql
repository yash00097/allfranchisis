-- CreateEnum
CREATE TYPE "WatchStatus" AS ENUM ('WATCHING', 'WATCHED');

-- CreateTable
CREATE TABLE "UserCollectionStatus" (
    "userId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "status" "WatchStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCollectionStatus_pkey" PRIMARY KEY ("userId","collectionId")
);

-- CreateIndex
CREATE INDEX "UserCollectionStatus_userId_status_idx" ON "UserCollectionStatus"("userId", "status");

-- CreateIndex
CREATE INDEX "UserCollectionStatus_collectionId_idx" ON "UserCollectionStatus"("collectionId");

-- AddForeignKey
ALTER TABLE "UserCollectionStatus" ADD CONSTRAINT "UserCollectionStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCollectionStatus" ADD CONSTRAINT "UserCollectionStatus_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
