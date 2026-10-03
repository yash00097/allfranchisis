-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('MOVIE', 'TV');

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "backdropUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaItem" (
    "id" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "mediaType" "MediaType" NOT NULL,
    "title" TEXT NOT NULL,
    "overview" TEXT,
    "posterPath" TEXT,
    "backdropPath" TEXT,
    "releaseDate" TIMESTAMP(3),
    "genres" TEXT[] NOT NULL,
    "runtime" INTEGER,
    "seasonCount" INTEGER,
    "episodeCount" INTEGER,
    "voteAverage" DOUBLE PRECISION,
    "voteCount" INTEGER,
    "isAnimated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionMedia" (
    "collectionId" TEXT NOT NULL,
    "mediaItemId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionMedia_pkey" PRIMARY KEY ("collectionId", "mediaItemId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");
CREATE INDEX "Collection_name_idx" ON "Collection"("name");
CREATE UNIQUE INDEX "MediaItem_tmdbId_mediaType_key" ON "MediaItem"("tmdbId", "mediaType");
CREATE INDEX "MediaItem_mediaType_idx" ON "MediaItem"("mediaType");
CREATE INDEX "MediaItem_releaseDate_idx" ON "MediaItem"("releaseDate");
CREATE INDEX "MediaItem_voteAverage_idx" ON "MediaItem"("voteAverage");
CREATE INDEX "CollectionMedia_collectionId_displayOrder_idx" ON "CollectionMedia"("collectionId", "displayOrder");
CREATE INDEX "CollectionMedia_mediaItemId_idx" ON "CollectionMedia"("mediaItemId");

-- AddForeignKey
ALTER TABLE "CollectionMedia" ADD CONSTRAINT "CollectionMedia_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollectionMedia" ADD CONSTRAINT "CollectionMedia_mediaItemId_fkey" FOREIGN KEY ("mediaItemId") REFERENCES "MediaItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
