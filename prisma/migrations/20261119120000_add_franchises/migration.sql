-- CreateTable
CREATE TABLE "Franchise" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "backdropUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Franchise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FranchiseCollection" (
    "franchiseId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FranchiseCollection_pkey" PRIMARY KEY ("franchiseId","collectionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Franchise_slug_key" ON "Franchise"("slug");

-- CreateIndex
CREATE INDEX "Franchise_name_idx" ON "Franchise"("name");

-- CreateIndex
CREATE INDEX "FranchiseCollection_franchiseId_displayOrder_idx" ON "FranchiseCollection"("franchiseId", "displayOrder");

-- CreateIndex
CREATE INDEX "FranchiseCollection_collectionId_idx" ON "FranchiseCollection"("collectionId");

-- AddForeignKey
ALTER TABLE "FranchiseCollection" ADD CONSTRAINT "FranchiseCollection_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FranchiseCollection" ADD CONSTRAINT "FranchiseCollection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

