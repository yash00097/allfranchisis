import { currentUser } from "@clerk/nextjs/server";
import { getPrismaClient } from "@/lib/prisma";

export async function syncCurrentUser() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const email = clerkUser.primaryEmailAddress?.emailAddress;

  if (!email) {
    throw new Error(
      "The authenticated Clerk user does not have a primary email address.",
    );
  }

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    clerkUser.username ||
    "Clerk user";

  return getPrismaClient().user.upsert({
    where: { clerkId: clerkUser.id },
    update: { email, name },
    create: { clerkId: clerkUser.id, email, name },
  });
}
