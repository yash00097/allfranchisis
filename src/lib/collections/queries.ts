import "server-only";

import { unstable_cache } from "next/cache";
import type { MediaType } from "@/generated/prisma/client";
import { COLLECTIONS_TAG, reviveDates } from "@/lib/collections/cache";
import {
  COLLECTION_GENRES,
  type CollectionGenre,
} from "@/lib/collections/genres";
import { getPrismaClient } from "@/lib/prisma";

const cacheOptions = { tags: [COLLECTIONS_TAG], revalidate: 3600 };

export async function listCollections() {
  return reviveDates(
    await unstable_cache(
      readCollections,
      ["collections", "all"],
      cacheOptions,
    )(),
  );
}

export async function listCollectionGenres(): Promise<CollectionGenre[]> {
  return unstable_cache(
    readCollectionGenres,
    ["collection-genres"],
    cacheOptions,
  )();
}

export async function getCollectionBySlug(slug: string) {
  return reviveDates(
    await unstable_cache(
      () => readCollectionBySlug(slug),
      ["collection-by-slug", slug],
      cacheOptions,
    )(),
  );
}

function readCollections() {
  return getPrismaClient().collection.findMany({
    include: { _count: { select: { media: true } } },
    orderBy: { name: "asc" },
  });
}

async function readCollectionGenres(): Promise<CollectionGenre[]> {
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
        include: {
          mediaItem: true,
          seasonGroups: {
            include: { seasons: true },
            orderBy: { displayOrder: "asc" },
          },
        },
        orderBy: { displayOrder: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}

function readCollectionBySlug(slug: string) {
  return getPrismaClient().collection.findUnique({
    where: { slug },
    include: {
      media: {
        include: {
          mediaItem: true,
          seasonGroups: {
            include: { seasons: true },
            orderBy: { displayOrder: "asc" },
          },
        },
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
