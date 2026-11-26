"use server";

import { revalidatePath } from "next/cache";
import { invalidateCollections } from "@/features/collections/cache";
import { MediaType, Prisma } from "@/generated/prisma/client";
import { requireCollectionManager } from "@/lib/auth/collection-manager";
import { sanitizeCollectionGenres } from "@/features/collections/genres";
import {
  appendNewSeasons,
  availableSeasonNumbers,
  mapSeasonGroups,
  validateSeasonGroups,
} from "@/features/collections/season-groups";
import { parseStringArray, slugify, text } from "@/lib/form-data";
import { getPrismaClient } from "@/lib/prisma";
import { getMovieDetails, getTvDetails, searchTmdb } from "@/lib/tmdb";

function dateOrNull(value: string | undefined) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function genresFromForm(formData: FormData) {
  return sanitizeCollectionGenres(formData.getAll("genres").map(String));
}

function mediaKey(mediaItemId: string) {
  return `media:${mediaItemId}`;
}

function groupKey(groupId: string) {
  return `group:${groupId}`;
}

// Sets displayOrder = position in `keys` with one UPDATE per table, not one
// per row. Returns the number of rows updated.
async function writeDisplayOrder(
  tx: Prisma.TransactionClient,
  collectionId: string,
  keys: string[],
) {
  const groups = { ids: [] as string[], orders: [] as number[] };
  const media = { ids: [] as string[], orders: [] as number[] };
  keys.forEach((key, order) => {
    const target = key.startsWith("group:") ? groups : media;
    target.ids.push(key.slice(key.indexOf(":") + 1));
    target.orders.push(order);
  });
  // Sequential: statements on one transaction connection run one at a time anyway.
  const groupCount = groups.ids.length
    ? await tx.$executeRaw`
            UPDATE "CollectionMediaSeasonGroup" AS g
            SET "displayOrder" = v.ord, "updatedAt" = now()
            FROM unnest(${groups.ids}::text[], ${groups.orders}::int[]) AS v(id, ord)
            WHERE g."id" = v.id AND g."collectionId" = ${collectionId}`
    : 0;
  const mediaCount = media.ids.length
    ? await tx.$executeRaw`
            UPDATE "CollectionMedia" AS m
            SET "displayOrder" = v.ord
            FROM unnest(${media.ids}::text[], ${media.orders}::int[]) AS v(id, ord)
            WHERE m."collectionId" = ${collectionId} AND m."mediaItemId" = v.id`
    : 0;
  return groupCount + mediaCount;
}

async function getVisibleCollectionEntries(
  tx: Prisma.TransactionClient,
  collectionId: string,
) {
  const rows = await tx.collectionMedia.findMany({
    where: { collectionId },
    include: {
      seasonGroups: { orderBy: { displayOrder: "asc" } },
    },
    orderBy: { displayOrder: "asc" },
  });
  return rows
    .flatMap((row) =>
      row.seasonGroups.length
        ? row.seasonGroups.map((group) => ({
            key: groupKey(group.id),
            displayOrder: group.displayOrder,
          }))
        : [{ key: mediaKey(row.mediaItemId), displayOrder: row.displayOrder }],
    )
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .map((entry) => entry.key);
}

export async function createCollection(formData: FormData) {
  await requireCollectionManager();
  const name = text(formData, "name");
  const description = text(formData, "description");
  const slug = slugify(text(formData, "slug") || name);
  if (!name || !description || !slug)
    throw new Error("Name, slug, and description are required.");

  await getPrismaClient().collection.create({
    data: {
      name,
      slug,
      description,
      genres: genresFromForm(formData),
      coverImageUrl: text(formData, "coverImageUrl") || null,
      backdropUrl: text(formData, "backdropUrl") || null,
    },
  });
  invalidateCollections();
  revalidatePath("/collections");
  revalidatePath("/favorites");
  revalidatePath("/watchlist");
  revalidatePath("/dashboard/collections");
}

export async function updateCollection(formData: FormData) {
  await requireCollectionManager();
  const id = text(formData, "id");
  const name = text(formData, "name");
  const description = text(formData, "description");
  const slug = slugify(text(formData, "slug") || name);
  if (!id || !name || !description || !slug)
    throw new Error("Collection fields are required.");

  await getPrismaClient().collection.update({
    where: { id },
    data: {
      name,
      slug,
      description,
      genres: genresFromForm(formData),
      coverImageUrl: text(formData, "coverImageUrl") || null,
      backdropUrl: text(formData, "backdropUrl") || null,
    },
  });
  invalidateCollections();
  revalidatePath("/collections");
  revalidatePath("/favorites");
  revalidatePath("/watchlist");
  revalidatePath("/dashboard/collections");
}

export async function deleteCollection(formData: FormData) {
  await requireCollectionManager();
  const id = text(formData, "id");
  if (!id) throw new Error("Collection ID is required.");
  await getPrismaClient().collection.delete({ where: { id } });
  invalidateCollections();
  revalidatePath("/collections");
  revalidatePath("/favorites");
  revalidatePath("/watchlist");
  revalidatePath("/dashboard/collections");
}

export async function searchCollectionMedia(query: string, page = 1) {
  await requireCollectionManager();
  const response = await searchTmdb(query, page);
  return response.results
    .filter(
      (result) => result.media_type === "movie" || result.media_type === "tv",
    )
    .map((result) => ({
      id: result.id,
      mediaType: (result.media_type === "movie" ? "MOVIE" : "TV") as
        | "MOVIE"
        | "TV",
      title: result.title || result.name || "Untitled",
      overview: result.overview || "",
      posterPath: result.poster_path || null,
      releaseDate: result.release_date || result.first_air_date || "",
      voteAverage: result.vote_average ?? null,
    }));
}

export async function addMediaToCollection(formData: FormData) {
  await requireCollectionManager();
  const collectionId = text(formData, "collectionId");
  const tmdbId = Number(text(formData, "tmdbId"));
  const mediaType = text(formData, "mediaType") as MediaType;
  if (
    !collectionId ||
    !Number.isInteger(tmdbId) ||
    tmdbId <= 0 ||
    ![MediaType.MOVIE, MediaType.TV].includes(mediaType)
  ) {
    throw new Error("Invalid media selection.");
  }

  const movie =
    mediaType === MediaType.MOVIE ? await getMovieDetails(tmdbId) : null;
  const tv = mediaType === MediaType.TV ? await getTvDetails(tmdbId) : null;
  const details = movie ?? tv;
  const title = movie?.title ?? tv?.name;
  if (!details || !title)
    throw new Error("TMDB returned incomplete media metadata.");
  const genres = details.genres?.map((genre) => genre.name) ?? [];
  const isAnimated = genres.some(
    (genre) => genre.toLowerCase() === "animation",
  );
  const prisma = getPrismaClient();
  const mediaItem = await prisma.mediaItem.upsert({
    where: { tmdbId_mediaType: { tmdbId, mediaType } },
    update: {
      title,
      overview: details.overview || null,
      posterPath: details.poster_path || null,
      backdropPath: details.backdrop_path || null,
      releaseDate: dateOrNull(
        mediaType === MediaType.MOVIE
          ? details.release_date
          : details.first_air_date,
      ),
      genres,
      runtime: movie?.runtime ?? null,
      seasonCount: tv?.number_of_seasons ?? null,
      episodeCount: tv?.number_of_episodes ?? null,
      voteAverage: details.vote_average ?? null,
      voteCount: details.vote_count ?? null,
      isAnimated,
    },
    create: {
      tmdbId,
      mediaType,
      title,
      overview: details.overview || null,
      posterPath: details.poster_path || null,
      backdropPath: details.backdrop_path || null,
      releaseDate: dateOrNull(
        mediaType === MediaType.MOVIE
          ? details.release_date
          : details.first_air_date,
      ),
      genres,
      runtime: movie?.runtime ?? null,
      seasonCount: tv?.number_of_seasons ?? null,
      episodeCount: tv?.number_of_episodes ?? null,
      voteAverage: details.vote_average ?? null,
      voteCount: details.vote_count ?? null,
      isAnimated,
    },
  });

  const existing = await prisma.collectionMedia.count({
    where: { collectionId },
  });
  await prisma.collectionMedia.upsert({
    where: {
      collectionId_mediaItemId: { collectionId, mediaItemId: mediaItem.id },
    },
    update: {},
    create: { collectionId, mediaItemId: mediaItem.id, displayOrder: existing },
  });
  invalidateCollections();
  revalidatePath("/collections");
  revalidatePath("/favorites");
  revalidatePath("/watchlist");
  revalidatePath("/dashboard/collections");
}

export async function saveSeasonSeparation(formData: FormData) {
  await requireCollectionManager();
  const collectionId = text(formData, "collectionId");
  const mediaItemId = text(formData, "mediaItemId");
  const rawGroups = JSON.parse(text(formData, "groups")) as unknown;
  if (
    !collectionId ||
    !mediaItemId ||
    !Array.isArray(rawGroups) ||
    rawGroups.some(
      (group) =>
        !group ||
        typeof group !== "object" ||
        !("seasons" in group) ||
        !Array.isArray(group.seasons) ||
        group.seasons.some((season: unknown) => !Number.isInteger(season)),
    )
  ) {
    throw new Error("Invalid season grouping.");
  }

  const prisma = getPrismaClient();
  const parent = await prisma.collectionMedia.findUnique({
    where: { collectionId_mediaItemId: { collectionId, mediaItemId } },
    include: {
      mediaItem: true,
      seasonGroups: {
        include: { seasons: true },
        orderBy: { displayOrder: "asc" },
      },
    },
  });
  if (!parent || parent.mediaItem.mediaType !== MediaType.TV) {
    throw new Error("Only TV media can be separated by season.");
  }

  const tv = await getTvDetails(parent.mediaItem.tmdbId);
  const seasonNumbers = availableSeasonNumbers(tv);
  const groups = validateSeasonGroups(
    rawGroups.map((group) => ({
      seasons: (group as { seasons: number[] }).seasons,
    })),
    seasonNumbers,
  );

  await prisma.$transaction(async (tx) => {
    const visibleEntries = await getVisibleCollectionEntries(tx, collectionId);
    const oldKeys = parent.seasonGroups.length
      ? parent.seasonGroups.map((group) => groupKey(group.id))
      : [mediaKey(mediaItemId)];
    const firstOldIndex = visibleEntries.findIndex((key) =>
      oldKeys.includes(key),
    );
    if (firstOldIndex < 0)
      throw new Error("Collection media entry was not found.");

    await tx.collectionMediaSeasonGroup.deleteMany({
      where: { collectionId, mediaItemId },
    });
    const groupIds = groups.map(() => crypto.randomUUID());
    await tx.collectionMediaSeasonGroup.createMany({
      data: groupIds.map((id, groupOrder) => ({
        id,
        collectionId,
        mediaItemId,
        groupOrder,
        displayOrder: firstOldIndex + groupOrder,
      })),
    });
    await tx.collectionMediaSeason.createMany({
      data: groupIds.flatMap((groupId, groupOrder) =>
        groups[groupOrder].map((seasonNumber) => ({ groupId, seasonNumber })),
      ),
    });

    const nextEntries = visibleEntries.filter((key) => !oldKeys.includes(key));
    nextEntries.splice(firstOldIndex, 0, ...groupIds.map(groupKey));
    await writeDisplayOrder(tx, collectionId, nextEntries);
    await tx.mediaItem.update({
      where: { id: mediaItemId },
      data: {
        title: tv.name,
        overview: tv.overview || null,
        posterPath: tv.poster_path || null,
        backdropPath: tv.backdrop_path || null,
        releaseDate: dateOrNull(tv.first_air_date),
        seasonCount: tv.number_of_seasons ?? null,
        episodeCount: tv.number_of_episodes ?? null,
        voteAverage: tv.vote_average ?? null,
        voteCount: tv.vote_count ?? null,
      },
    });
  });

  invalidateCollections();
  revalidatePath("/collections");
  revalidatePath("/favorites");
  revalidatePath("/watchlist");
  revalidatePath("/dashboard/collections");
}

export async function refreshTvSeasonSeparation(formData: FormData) {
  await requireCollectionManager();
  const collectionId = text(formData, "collectionId");
  const mediaItemId = text(formData, "mediaItemId");
  const prisma = getPrismaClient();
  const parent = await prisma.collectionMedia.findUnique({
    where: { collectionId_mediaItemId: { collectionId, mediaItemId } },
    include: {
      mediaItem: true,
      seasonGroups: {
        include: { seasons: true },
        orderBy: { displayOrder: "asc" },
      },
    },
  });
  if (!parent || parent.mediaItem.mediaType !== MediaType.TV) {
    throw new Error("Only TV media can be refreshed by season.");
  }

  const tv = await getTvDetails(parent.mediaItem.tmdbId);
  const available = availableSeasonNumbers(tv);
  const current = mapSeasonGroups(
    parent.seasonGroups,
    available,
    parent.displayOrder,
  );
  const next = appendNewSeasons(current, available);
  const added = next.some(
    (group, index) =>
      group.seasonNumbers.length !== current[index]?.seasonNumbers.length,
  );

  if (parent.seasonGroups.length && added) {
    const last = next.at(-1);
    if (!last?.id) throw new Error("Season group state is invalid.");
    const newSeasons = last.seasonNumbers.filter(
      (season) =>
        !current.some((group) => group.seasonNumbers.includes(season)),
    );
    await prisma.$transaction([
      prisma.collectionMediaSeason.createMany({
        data: newSeasons.map((seasonNumber) => ({
          groupId: last.id as string,
          seasonNumber,
        })),
        skipDuplicates: true,
      }),
      prisma.mediaItem.update({
        where: { id: mediaItemId },
        data: {
          seasonCount: tv.number_of_seasons ?? null,
          episodeCount: tv.number_of_episodes ?? null,
          updatedAt: new Date(),
        },
      }),
    ]);
  } else {
    await prisma.mediaItem.update({
      where: { id: mediaItemId },
      data: {
        seasonCount: tv.number_of_seasons ?? null,
        episodeCount: tv.number_of_episodes ?? null,
      },
    });
  }

  invalidateCollections();
  revalidatePath("/collections");
  revalidatePath("/favorites");
  revalidatePath("/watchlist");
  revalidatePath("/dashboard/collections");
  return {
    seasonNumbers: available,
    groups: next,
  };
}

export async function removeMediaFromCollection(formData: FormData) {
  await requireCollectionManager();
  const collectionId = text(formData, "collectionId");
  const mediaItemId = text(formData, "mediaItemId");
  await getPrismaClient().collectionMedia.delete({
    where: { collectionId_mediaItemId: { collectionId, mediaItemId } },
  });
  invalidateCollections();
  revalidatePath("/collections");
  revalidatePath("/favorites");
  revalidatePath("/watchlist");
  revalidatePath("/dashboard/collections");
}

export async function reorderCollectionMedia(formData: FormData) {
  await requireCollectionManager();
  const collectionId = text(formData, "collectionId");
  const submitted = parseStringArray(
    text(formData, "mediaKeys") || text(formData, "mediaItemIds"),
    "Invalid collection order.",
  );
  const prisma = getPrismaClient();
  const rows = await prisma.collectionMedia.findMany({
    where: { collectionId },
    include: { seasonGroups: true },
  });
  const expected = rows.flatMap((row) =>
    row.seasonGroups.length
      ? row.seasonGroups.map((group) => groupKey(group.id))
      : [mediaKey(row.mediaItemId)],
  );
  const normalizedSubmitted = submitted.map((key) =>
    key.startsWith("media:") || key.startsWith("group:") ? key : mediaKey(key),
  );
  if (
    normalizedSubmitted.length !== expected.length ||
    new Set(normalizedSubmitted).size !== expected.length ||
    normalizedSubmitted.some((key) => !expected.includes(key))
  ) {
    throw new Error("Collection order is out of date. Refresh and try again.");
  }
  await prisma.$transaction(
    async (tx) => {
      const updated = await writeDisplayOrder(
        tx,
        collectionId,
        normalizedSubmitted,
      );
      // A row deleted since validation: roll back, as the per-row updates did.
      if (updated !== normalizedSubmitted.length) {
        throw new Error(
          "Collection order is out of date. Refresh and try again.",
        );
      }
    },
    { maxWait: 10_000, timeout: 20_000 },
  );
  invalidateCollections();
  revalidatePath("/collections");
  revalidatePath("/favorites");
  revalidatePath("/watchlist");
  revalidatePath("/dashboard/collections");
}
