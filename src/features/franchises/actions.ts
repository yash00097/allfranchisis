"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { requireCollectionManager } from "@/lib/auth/collection-manager";
import { invalidateFranchises } from "@/features/collections/cache";
import { parseStringArray, slugify, text } from "@/lib/form-data";
import { getPrismaClient } from "@/lib/prisma";

// Expected failures are returned, not thrown: Next redacts thrown messages in production.
export type FranchiseActionResult = { error?: string };

const STALE_ORDER = "Franchise order is out of date. Refresh and try again.";

function refreshFranchises() {
  invalidateFranchises();
  revalidatePath("/franchises");
  revalidatePath("/franchises/[slug]", "page");
  revalidatePath("/dashboard/franchises");
}

function franchiseFields(formData: FormData) {
  const name = text(formData, "name");
  return {
    name,
    slug: slugify(text(formData, "slug") || name),
    description: text(formData, "description"),
    coverImageUrl: text(formData, "coverImageUrl") || null,
    backdropUrl: text(formData, "backdropUrl") || null,
  };
}

function isUniqueViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function saveFranchise(
  formData: FormData,
  write: (data: ReturnType<typeof franchiseFields>) => Promise<unknown>,
): Promise<FranchiseActionResult> {
  const data = franchiseFields(formData);
  if (!data.name || !data.description || !data.slug) {
    return { error: "Name, slug, and description are required." };
  }
  try {
    await write(data);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: "A franchise with this slug already exists." };
    }
    throw error;
  }
  refreshFranchises();
  return {};
}

export async function createFranchise(
  formData: FormData,
): Promise<FranchiseActionResult> {
  await requireCollectionManager();
  return saveFranchise(formData, (data) =>
    getPrismaClient().franchise.create({ data }),
  );
}

export async function updateFranchise(
  formData: FormData,
): Promise<FranchiseActionResult> {
  await requireCollectionManager();
  const id = text(formData, "id");
  if (!id) return { error: "Franchise ID is required." };
  return saveFranchise(formData, (data) =>
    getPrismaClient().franchise.update({ where: { id }, data }),
  );
}

export async function deleteFranchise(
  formData: FormData,
): Promise<FranchiseActionResult> {
  await requireCollectionManager();
  const id = text(formData, "id");
  if (!id) return { error: "Franchise ID is required." };
  // Cascade removes FranchiseCollection rows only; collections are kept.
  await getPrismaClient().franchise.deleteMany({ where: { id } });
  refreshFranchises();
  return {};
}

export async function addCollectionToFranchise(
  formData: FormData,
): Promise<FranchiseActionResult> {
  await requireCollectionManager();
  const franchiseId = text(formData, "franchiseId");
  const collectionId = text(formData, "collectionId");
  if (!franchiseId || !collectionId) {
    return { error: "Franchise and collection are required." };
  }
  try {
    await getPrismaClient().$transaction(async (tx) => {
      const existing = await tx.franchiseCollection.findUnique({
        where: { franchiseId_collectionId: { franchiseId, collectionId } },
      });
      if (existing) return;
      // max + 1, not count: deleted collections leave gaps that count would collide with.
      const { _max } = await tx.franchiseCollection.aggregate({
        where: { franchiseId },
        _max: { displayOrder: true },
      });
      await tx.franchiseCollection.create({
        data: {
          franchiseId,
          collectionId,
          displayOrder: (_max.displayOrder ?? -1) + 1,
        },
      });
    });
  } catch (error) {
    // A concurrent add of the same pair is still a no-op.
    if (!isUniqueViolation(error)) throw error;
  }
  refreshFranchises();
  return {};
}

export async function removeCollectionFromFranchise(
  formData: FormData,
): Promise<FranchiseActionResult> {
  await requireCollectionManager();
  const franchiseId = text(formData, "franchiseId");
  const collectionId = text(formData, "collectionId");
  if (!franchiseId || !collectionId) {
    return { error: "Franchise and collection are required." };
  }
  await getPrismaClient().$transaction(async (tx) => {
    await tx.franchiseCollection.deleteMany({
      where: { franchiseId, collectionId },
    });
    const remaining = await tx.franchiseCollection.findMany({
      where: { franchiseId },
      orderBy: [{ displayOrder: "asc" }, { addedAt: "asc" }],
    });
    for (const [displayOrder, row] of remaining.entries()) {
      await tx.franchiseCollection.update({
        where: {
          franchiseId_collectionId: {
            franchiseId,
            collectionId: row.collectionId,
          },
        },
        data: { displayOrder },
      });
    }
  });
  refreshFranchises();
  return {};
}

export async function reorderFranchiseCollections(
  formData: FormData,
): Promise<FranchiseActionResult> {
  await requireCollectionManager();
  const franchiseId = text(formData, "franchiseId");
  let submitted: string[];
  try {
    submitted = parseStringArray(
      text(formData, "collectionIds"),
      "Invalid franchise order.",
    );
  } catch {
    return { error: "Invalid franchise order." };
  }
  // Check and write in one transaction so a concurrent add/remove cannot slip between them.
  const stale = await getPrismaClient().$transaction(async (tx) => {
    const rows = await tx.franchiseCollection.findMany({
      where: { franchiseId },
      select: { collectionId: true },
    });
    const expected = new Set(rows.map((row) => row.collectionId));
    if (
      submitted.length !== expected.size ||
      new Set(submitted).size !== expected.size ||
      submitted.some((id) => !expected.has(id))
    ) {
      return true;
    }
    for (const [displayOrder, collectionId] of submitted.entries()) {
      await tx.franchiseCollection.update({
        where: { franchiseId_collectionId: { franchiseId, collectionId } },
        data: { displayOrder },
      });
    }
    return false;
  });
  if (stale) return { error: STALE_ORDER };
  refreshFranchises();
  return {};
}
