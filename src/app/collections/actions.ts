"use server";

import { revalidatePath } from "next/cache";
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

  revalidatePath("/collections");
  revalidatePath(`/collections/${slug}`);
  revalidatePath("/watching");
  revalidatePath("/watched");
}
