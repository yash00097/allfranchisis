-- CreateTable
CREATE TABLE "CollectionMediaSeasonGroup" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "mediaItemId" TEXT NOT NULL,
    "groupOrder" INTEGER NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionMediaSeasonGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionMediaSeason" (
    "groupId" TEXT NOT NULL,
    "seasonNumber" INTEGER NOT NULL,

    CONSTRAINT "CollectionMediaSeason_pkey" PRIMARY KEY ("groupId","seasonNumber")
);

-- CreateIndex
CREATE INDEX "CollectionMediaSeasonGroup_collectionId_displayOrder_idx" ON "CollectionMediaSeasonGroup"("collectionId", "displayOrder");

-- CreateIndex
CREATE INDEX "CollectionMediaSeasonGroup_collectionId_mediaItemId_idx" ON "CollectionMediaSeasonGroup"("collectionId", "mediaItemId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionMediaSeasonGroup_collectionId_mediaItemId_groupOr_key" ON "CollectionMediaSeasonGroup"("collectionId", "mediaItemId", "groupOrder");

-- CreateIndex
CREATE INDEX "CollectionMediaSeason_seasonNumber_idx" ON "CollectionMediaSeason"("seasonNumber");

-- AddForeignKey
ALTER TABLE "CollectionMediaSeasonGroup" ADD CONSTRAINT "CollectionMediaSeasonGroup_collectionId_mediaItemId_fkey" FOREIGN KEY ("collectionId", "mediaItemId") REFERENCES "CollectionMedia"("collectionId", "mediaItemId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionMediaSeason" ADD CONSTRAINT "CollectionMediaSeason_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CollectionMediaSeasonGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
