import "server-only";

import { unstable_cache } from "next/cache";
import {
  COLLECTIONS_TAG,
  DISCOVERY_TAG,
  reviveDates,
} from "@/lib/collections/cache";
import { getPrismaClient } from "@/lib/prisma";

const POSTER_LIMIT = 28;
const FEATURED_ITEM_LIMIT = 8;
const inAnyCollection = { collections: { some: {} } } as const;

export async function getLandingData() {
  return reviveDates(
    await unstable_cache(readLandingData, ["landing-data"], {
      tags: [COLLECTIONS_TAG, DISCOVERY_TAG],
      revalidate: 300,
    })(),
  );
}

async function readLandingData() {
  const prisma = getPrismaClient();
  const [collectionCount, movieCount, showCount, posters, featured] =
    await Promise.all([
      prisma.collection.count(),
      prisma.mediaItem.count({
        where: { ...inAnyCollection, mediaType: "MOVIE" },
      }),
      prisma.mediaItem.count({
        where: { ...inAnyCollection, mediaType: "TV" },
      }),
      prisma.mediaItem.findMany({
        where: { ...inAnyCollection, posterPath: { not: null } },
        select: { id: true, title: true, posterPath: true },
        orderBy: [
          { voteCount: { sort: "desc", nulls: "last" } },
          { id: "asc" },
        ],
        take: POSTER_LIMIT,
      }),
      // The largest collection gives the clearest example of a watch order.
      prisma.collection.findFirst({
        orderBy: [{ media: { _count: "desc" } }, { id: "asc" }],
        select: {
          slug: true,
          name: true,
          _count: { select: { media: true } },
          media: {
            orderBy: { displayOrder: "asc" },
            take: FEATURED_ITEM_LIMIT,
            select: {
              mediaItem: {
                select: {
                  id: true,
                  title: true,
                  mediaType: true,
                  releaseDate: true,
                  isAnimated: true,
                },
              },
            },
          },
        },
      }),
    ]);

  return {
    stats: { collectionCount, movieCount, showCount },
    posters,
    featured,
  };
}
