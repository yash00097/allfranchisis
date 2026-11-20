CREATE TABLE "UserCollectionWatchlist" (
    "userId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCollectionWatchlist_pkey" PRIMARY KEY ("userId","collectionId")
);

CREATE INDEX "UserCollectionWatchlist_userId_createdAt_idx" ON "UserCollectionWatchlist"("userId", "createdAt");

CREATE INDEX "UserCollectionWatchlist_collectionId_idx" ON "UserCollectionWatchlist"("collectionId");

ALTER TABLE "UserCollectionWatchlist" ADD CONSTRAINT "UserCollectionWatchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserCollectionWatchlist" ADD CONSTRAINT "UserCollectionWatchlist_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
