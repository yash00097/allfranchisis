import "server-only";

import { getPrismaClient } from "@/lib/prisma";

export async function getCollectionWatchlisted({
  userId,
  collectionId,
}: {
  userId: string;
  collectionId: string;
}): Promise<boolean> {
  return (
    (await getPrismaClient().userCollectionWatchlist.findUnique({
      where: { userId_collectionId: { userId, collectionId } },
      select: { collectionId: true },
    })) !== null
  );
}

export async function listUserWatchlistCollections({
  userId,
}: {
  userId: string;
}) {
  const rows = await getPrismaClient().userCollectionWatchlist.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { collectionId: "asc" }],
    include: {
      collection: { include: { _count: { select: { media: true } } } },
    },
  });
  return rows.map((row) => row.collection);
}
