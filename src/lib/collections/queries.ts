import "server-only";

import type { MediaType } from "@/generated/prisma/client";
import {
  COLLECTION_GENRES,
  type CollectionGenre,
} from "@/lib/collections/genres";
import { getPrismaClient } from "@/lib/prisma";

export async function listCollections(
  options: { genre?: CollectionGenre } = {},
) {
  const { genre } = options;
  return getPrismaClient().collection.findMany({
    where: genre ? { genres: { has: genre } } : undefined,
    include: { _count: { select: { media: true } } },
    orderBy: { name: "asc" },
  });
}

export async function listCollectionGenres(): Promise<CollectionGenre[]> {
  const rows = await getPrismaClient().collection.findMany({
    select: { genres: true },
  });
  const inUse = new Set(rows.flatMap((row) => row.genres));
  return COLLECTION_GENRES.filter((genre) => inUse.has(genre));
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
