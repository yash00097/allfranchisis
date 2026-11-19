import "server-only";

import { unstable_cache } from "next/cache";
import {
  COLLECTIONS_TAG,
  FRANCHISES_TAG,
  reviveDates,
} from "@/lib/collections/cache";
import { getPrismaClient } from "@/lib/prisma";

// Collection tag included so collection edits refresh franchise pages too.
const cacheOptions = {
  tags: [COLLECTIONS_TAG, FRANCHISES_TAG],
  revalidate: 3600,
};

export async function listFranchises() {
  return reviveDates(
    await unstable_cache(readFranchises, ["franchises"], cacheOptions)(),
  );
}

export async function getFranchiseBySlug(slug: string) {
  return reviveDates(
    await unstable_cache(
      () => readFranchiseBySlug(slug),
      ["franchise-by-slug", slug],
      cacheOptions,
    )(),
  );
}

export async function listFranchisesForManager() {
  return getPrismaClient().franchise.findMany({
    include: {
      collections: {
        include: {
          collection: { select: { id: true, name: true, slug: true } },
        },
        orderBy: [{ displayOrder: "asc" }, { addedAt: "asc" }],
      },
    },
    orderBy: { name: "asc" },
  });
}

function readFranchises() {
  return getPrismaClient().franchise.findMany({
    include: { _count: { select: { collections: true } } },
    orderBy: { name: "asc" },
  });
}

function readFranchiseBySlug(slug: string) {
  return getPrismaClient().franchise.findUnique({
    where: { slug },
    include: {
      collections: {
        include: {
          collection: {
            include: { _count: { select: { media: true } } },
          },
        },
        orderBy: [{ displayOrder: "asc" }, { addedAt: "asc" }],
      },
    },
  });
}
