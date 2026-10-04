"use server";

import { revalidatePath } from "next/cache";
import { MediaType } from "@/generated/prisma/client";
import { requireCollectionManager } from "@/lib/auth/collection-manager";
import { getPrismaClient } from "@/lib/prisma";
import { getMovieDetails, getTvDetails, searchTmdb } from "@/lib/tmdb";

function text(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function dateOrNull(value: string | undefined) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
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
      coverImageUrl: text(formData, "coverImageUrl") || null,
      backdropUrl: text(formData, "backdropUrl") || null,
    },
  });
  revalidatePath("/collections");
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
      coverImageUrl: text(formData, "coverImageUrl") || null,
      backdropUrl: text(formData, "backdropUrl") || null,
    },
  });
  revalidatePath("/collections");
  revalidatePath("/dashboard/collections");
}

export async function deleteCollection(formData: FormData) {
  await requireCollectionManager();
  const id = text(formData, "id");
  if (!id) throw new Error("Collection ID is required.");
  await getPrismaClient().collection.delete({ where: { id } });
  revalidatePath("/collections");
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
  revalidatePath("/collections");
  revalidatePath("/dashboard/collections");
}

export async function removeMediaFromCollection(formData: FormData) {
  await requireCollectionManager();
  const collectionId = text(formData, "collectionId");
  const mediaItemId = text(formData, "mediaItemId");
  await getPrismaClient().collectionMedia.delete({
    where: { collectionId_mediaItemId: { collectionId, mediaItemId } },
  });
  revalidatePath("/collections");
  revalidatePath("/dashboard/collections");
}

export async function reorderCollectionMedia(formData: FormData) {
  await requireCollectionManager();
  const collectionId = text(formData, "collectionId");
  const mediaItemIds = JSON.parse(text(formData, "mediaItemIds")) as unknown;
  if (
    !Array.isArray(mediaItemIds) ||
    mediaItemIds.some((id) => typeof id !== "string")
  )
    throw new Error("Invalid collection order.");
  const prisma = getPrismaClient();
  await prisma.$transaction(
    mediaItemIds.map((mediaItemId, displayOrder) =>
      prisma.collectionMedia.update({
        where: { collectionId_mediaItemId: { collectionId, mediaItemId } },
        data: { displayOrder },
      }),
    ),
    {
      maxWait: 10_000,
      timeout: 20_000,
    },
  );
  revalidatePath("/collections");
  revalidatePath("/dashboard/collections");
}
