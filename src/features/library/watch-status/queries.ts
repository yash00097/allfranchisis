import "server-only";

import { getPrismaClient } from "@/lib/prisma";
import { type WatchStatus } from "@/features/library/watch-status/types";

export async function getCollectionStatus({
  userId,
  collectionId,
}: {
  userId: string;
  collectionId: string;
}): Promise<WatchStatus | null> {
  const row = await getPrismaClient().userCollectionStatus.findUnique({
    where: { userId_collectionId: { userId, collectionId } },
    select: { status: true },
  });
  return row?.status ?? null;
}

export async function getCollectionStatuses({
  userId,
  collectionIds,
}: {
  userId: string;
  collectionIds: string[];
}): Promise<Map<string, WatchStatus>> {
  if (collectionIds.length === 0) return new Map();

  const rows = await getPrismaClient().userCollectionStatus.findMany({
    where: { userId, collectionId: { in: collectionIds } },
    select: { collectionId: true, status: true },
  });

  return new Map(rows.map((row) => [row.collectionId, row.status]));
}

export async function listUserCollectionsByStatus({
  userId,
  status,
}: {
  userId: string;
  status: WatchStatus;
}) {
  const rows = await getPrismaClient().userCollectionStatus.findMany({
    where: { userId, status },
    orderBy: { updatedAt: "desc" },
    include: {
      collection: { include: { _count: { select: { media: true } } } },
    },
  });
  return rows.map((row) => row.collection);
}
