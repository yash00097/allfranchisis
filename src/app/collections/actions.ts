"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath, revalidateTag } from "next/cache";
import { DISCOVERY_TAG } from "@/lib/collections/cache";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getPrismaClient } from "@/lib/prisma";
import { isWatchStatus } from "@/lib/watch-status/types";

const CLEAR = "NONE";

export async function setCollectionStatus(formData: FormData): Promise<void> {
  const user = await requireCurrentUser();

  const rawSlug = formData.get("slug");
  const rawStatus = formData.get("status");
  const slug = typeof rawSlug === "string" ? rawSlug.trim() : "";
  const status = typeof rawStatus === "string" ? rawStatus.trim() : "";

  if (!slug) throw new Error("Collection is required.");
  if (status !== CLEAR && !isWatchStatus(status))
    throw new Error("Invalid watch status.");

  const prisma = getPrismaClient();
  const collection = await prisma.collection.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!collection) throw new Error("Collection not found.");

  if (status === CLEAR) {
    await prisma.userCollectionStatus.deleteMany({
      where: { userId: user.id, collectionId: collection.id },
    });
  } else if (isWatchStatus(status)) {
    const key = { userId: user.id, collectionId: collection.id };
    await prisma.userCollectionStatus.upsert({
      where: { userId_collectionId: key },
      update: { status },
      create: { ...key, status },
    });
  }

  revalidateTag(DISCOVERY_TAG, { expire: 0 });
  revalidatePath("/collections");
  revalidatePath(`/collections/${slug}`);
  revalidatePath("/watching");
  revalidatePath("/watched");
  revalidatePath("/favorites");
  revalidatePath("/watchlist");
  revalidatePath("/franchises", "layout");
}

export async function setCollectionFavorite(
  formData: FormData,
): Promise<{ error: string | null }> {
  const user = await requireCurrentUser();
  const rawSlug = formData.get("slug");
  const favorite = formData.get("favorite");
  const slug = typeof rawSlug === "string" ? rawSlug.trim() : "";

  if (!slug) return { error: "Collection is required." };
  if (favorite !== "true" && favorite !== "false")
    return { error: "Invalid favorite state." };

  try {
    const prisma = getPrismaClient();
    const collection = await prisma.collection.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!collection) return { error: "Collection not found." };

    const key = { userId: user.id, collectionId: collection.id };
    if (favorite === "true") {
      await prisma.userCollectionFavorite.createMany({
        data: [key],
        skipDuplicates: true,
      });
    } else {
      await prisma.userCollectionFavorite.deleteMany({ where: key });
    }
  } catch (error) {
    Sentry.captureException(error);
    return { error: "Could not update favorites. Please try again." };
  }

  revalidateTag(DISCOVERY_TAG, { expire: 0 });
  revalidatePath("/collections");
  revalidatePath(`/collections/${slug}`);
  revalidatePath("/watching");
  revalidatePath("/watched");
  revalidatePath("/favorites");
  revalidatePath("/franchises", "layout");
  return { error: null };
}

export async function setCollectionWatchlist(
  formData: FormData,
): Promise<{ error: string | null }> {
  const user = await requireCurrentUser();
  const rawSlug = formData.get("slug");
  const watchlist = formData.get("watchlist");
  const slug = typeof rawSlug === "string" ? rawSlug.trim() : "";

  if (!slug) return { error: "Collection is required." };
  if (watchlist !== "true" && watchlist !== "false")
    return { error: "Invalid watchlist state." };

  try {
    const prisma = getPrismaClient();
    const collection = await prisma.collection.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!collection) return { error: "Collection not found." };

    const key = { userId: user.id, collectionId: collection.id };
    if (watchlist === "true") {
      await prisma.userCollectionWatchlist.createMany({
        data: [key],
        skipDuplicates: true,
      });
    } else {
      await prisma.userCollectionWatchlist.deleteMany({ where: key });
    }
  } catch (error) {
    Sentry.captureException(error);
    return { error: "Could not update watchlist. Please try again." };
  }

  revalidatePath(`/collections/${slug}`);
  revalidatePath("/watchlist");
  return { error: null };
}
