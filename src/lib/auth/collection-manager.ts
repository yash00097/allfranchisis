import "server-only";

import { auth } from "@clerk/nextjs/server";

export async function requireCollectionManager() {
  const { userId } = await auth();
  if (!isConfiguredManager(userId)) {
    if (!userId) throw new Error("Authentication required.");
    throw new Error("Collection manager access required.");
  }

  return userId;
}

export async function isCollectionManager() {
  const { userId } = await auth();
  return isConfiguredManager(userId);
}

function isConfiguredManager(userId: string | null) {
  const managerId = process.env.COLLECTION_MANAGER_CLERK_ID?.trim();
  return Boolean(userId && managerId && userId === managerId);
}
