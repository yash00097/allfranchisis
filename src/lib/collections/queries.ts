import "server-only";

import type { MediaType } from "@/generated/prisma/client";
import { getPrismaClient } from "@/lib/prisma";

export async function listCollections() {
  return getPrismaClient().collection.findMany({
    include: { _count: { select: { media: true } } },
    orderBy: { name: "asc" },
  });
}

export async function listCollectionsForManager() {
  return getPrismaClient().collection.findMany({
    include: {
      media: {
        include: { mediaItem: true },
        orderBy: { displayOrder: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getCollectionBySlug(slug: string) {
  return getPrismaClient().collection.findUnique({
    where: { slug },
    include: {
      media: {
        include: { mediaItem: true },
        orderBy: { displayOrder: "asc" },
      },
    },
  });
}

export async function getMediaItem(tmdbId: number, mediaType: MediaType) {
  return getPrismaClient().mediaItem.findUnique({
    where: { tmdbId_mediaType: { tmdbId, mediaType } },
  });
}
