import "server-only";

import { unstable_cache } from "next/cache";
import {
  COLLECTIONS_TAG,
  DISCOVERY_TAG,
  reviveDates,
} from "@/features/collections/cache";
import { getPrismaClient } from "@/lib/prisma";

const mediaCount = { _count: { select: { media: true } } } as const;

export async function listCollectionDiscovery() {
  return reviveDates(
    await unstable_cache(readCollectionDiscovery, ["collection-discovery"], {
      tags: [COLLECTIONS_TAG, DISCOVERY_TAG],
      revalidate: 300,
    })(),
  );
}

async function readCollectionDiscovery() {
  const prisma = getPrismaClient();
  const [recentlyUpdated, favoriteGroups, watchedGroups] = await Promise.all([
    prisma.collection.findMany({
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      take: 4,
      include: mediaCount,
    }),
    prisma.userCollectionFavorite.groupBy({
      by: ["collectionId"],
      orderBy: [{ _count: { collectionId: "desc" } }, { collectionId: "asc" }],
      take: 4,
      _count: { collectionId: true },
    }),
    prisma.userCollectionStatus.groupBy({
      by: ["collectionId"],
      where: { status: "WATCHED" },
      orderBy: [{ _count: { collectionId: "desc" } }, { collectionId: "asc" }],
      take: 4,
      _count: { collectionId: true },
    }),
  ]);

  const [favoriteCollections, watchedCollections] = await Promise.all([
    prisma.collection.findMany({
      where: {
        id: { in: favoriteGroups.map(({ collectionId }) => collectionId) },
      },
      include: mediaCount,
    }),
    prisma.collection.findMany({
      where: {
        id: { in: watchedGroups.map(({ collectionId }) => collectionId) },
      },
      include: mediaCount,
    }),
  ]);
  const favoritesById = new Map(
    favoriteCollections.map((collection) => [collection.id, collection]),
  );
  const collectionsById = new Map(
    watchedCollections.map((collection) => [collection.id, collection]),
  );

  return {
    recentlyUpdated,
    mostFavorited: favoriteGroups.flatMap(({ collectionId }) => {
      const collection = favoritesById.get(collectionId);
      return collection ? [collection] : [];
    }),
    mostWatched: watchedGroups.flatMap(({ collectionId }) => {
      const collection = collectionsById.get(collectionId);
      return collection ? [collection] : [];
    }),
  };
}
