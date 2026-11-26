import "server-only";

import { auth } from "@clerk/nextjs/server";
import { cache } from "react";
import { syncCurrentUser } from "@/lib/auth/sync-current-user";
import { getPrismaClient } from "@/lib/prisma";

// React cache() dedupes the lookup across layout, page and helpers per request.
export const getCurrentUser = cache(async () => {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await getPrismaClient().user.findUnique({
    where: { clerkId: userId },
  });
  if (existing) return existing;

  // Webhook has not landed yet (or was missed): fall back to the lazy sync.
  return syncCurrentUser();
});

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Authentication required.");
  return user;
}
