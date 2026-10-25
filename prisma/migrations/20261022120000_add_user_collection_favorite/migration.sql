CREATE TABLE "UserCollectionFavorite" (
    "userId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCollectionFavorite_pkey" PRIMARY KEY ("userId","collectionId")
);

CREATE INDEX "UserCollectionFavorite_userId_createdAt_idx" ON "UserCollectionFavorite"("userId", "createdAt");

CREATE INDEX "UserCollectionFavorite_collectionId_idx" ON "UserCollectionFavorite"("collectionId");

ALTER TABLE "UserCollectionFavorite" ADD CONSTRAINT "UserCollectionFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserCollectionFavorite" ADD CONSTRAINT "UserCollectionFavorite_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
