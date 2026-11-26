import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { MediaType } from "@/generated/prisma/client";
import { COLLECTIONS_TAG, reviveDates } from "@/features/collections/cache";
import {
  COLLECTION_GENRES,
  type CollectionGenre,
} from "@/features/collections/genres";
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

// React cache() shares one result between generateMetadata and the page.
export const getCollectionBySlug = cache(async (slug: string) =>
  reviveDates(
    await unstable_cache(
      () => readCollectionBySlug(slug),
      ["collection-by-slug", slug],
      cacheOptions,
    )(),
  ),
);

export async function getCollectionSummaryBySlug(slug: string) {
  return unstable_cache(
    () =>
      getPrismaClient().collection.findUnique({
        where: { slug },
        select: { slug: true, name: true },
      }),
    ["collection-summary-by-slug", slug],
    cacheOptions,
  )();
}

// Only the fields search and CollectionCard read: this list ships to the client.
function readCollections() {
  return getPrismaClient().collection.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      genres: true,
      coverImageUrl: true,
      _count: { select: { media: true } },
    },
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
