import "server-only";

import { getPrismaClient } from "@/lib/prisma";

const mediaCount = { _count: { select: { media: true } } } as const;

export async function listCollectionDiscovery({ userId }: { userId?: string }) {
  const prisma = getPrismaClient();
  const [recentlyUpdated, favoriteRows, watchedGroups] = await Promise.all([
    prisma.collection.findMany({
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      take: 4,
      include: mediaCount,
    }),
    userId
      ? prisma.userCollectionFavorite.findMany({
          where: { userId },
          orderBy: [{ createdAt: "desc" }, { collectionId: "asc" }],
          take: 4,
          include: { collection: { include: mediaCount } },
        })
      : Promise.resolve([]),
    prisma.userCollectionStatus.groupBy({
      by: ["collectionId"],
      where: { status: "WATCHED" },
      orderBy: [{ _count: { collectionId: "desc" } }, { collectionId: "asc" }],
      take: 4,
      _count: { collectionId: true },
    }),
  ]);

  const watchedCollections = await prisma.collection.findMany({
    where: {
      id: { in: watchedGroups.map(({ collectionId }) => collectionId) },
    },
    include: mediaCount,
  });
  const collectionsById = new Map(
    watchedCollections.map((collection) => [collection.id, collection]),
  );

  return {
    userFavorites: favoriteRows.map(({ collection }) => collection),
    recentlyUpdated,
    mostWatched: watchedGroups.flatMap(({ collectionId }) => {
      const collection = collectionsById.get(collectionId);
      return collection ? [collection] : [];
    }),
  };
}
