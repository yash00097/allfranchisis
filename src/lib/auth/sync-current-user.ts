import { currentUser } from "@clerk/nextjs/server";
import { upsertClerkUser } from "@/lib/auth/upsert-clerk-user";

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

  return upsertClerkUser({ clerkId: clerkUser.id, email, name });
}
