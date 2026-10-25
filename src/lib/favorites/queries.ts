import "server-only";

import { getPrismaClient } from "@/lib/prisma";

export async function getCollectionFavorite({
  userId,
  collectionId,
}: {
  userId: string;
  collectionId: string;
}): Promise<boolean> {
  return (
    (await getPrismaClient().userCollectionFavorite.findUnique({
      where: { userId_collectionId: { userId, collectionId } },
      select: { collectionId: true },
    })) !== null
  );
}

export async function getCollectionFavorites({
  userId,
  collectionIds,
}: {
  userId: string;
  collectionIds: string[];
}): Promise<Set<string>> {
  if (collectionIds.length === 0) return new Set();

  const rows = await getPrismaClient().userCollectionFavorite.findMany({
    where: { userId, collectionId: { in: collectionIds } },
    select: { collectionId: true },
  });
  return new Set(rows.map((row) => row.collectionId));
}

export async function listUserFavoriteCollections({
  userId,
}: {
  userId: string;
}) {
  const rows = await getPrismaClient().userCollectionFavorite.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { collectionId: "asc" }],
    include: {
      collection: { include: { _count: { select: { media: true } } } },
    },
  });
  return rows.map((row) => row.collection);
}
