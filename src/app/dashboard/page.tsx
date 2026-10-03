import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { syncCurrentUser } from "@/lib/auth/sync-current-user";
import { isCollectionManager } from "@/lib/auth/collection-manager";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await auth.protect();
  const user = await syncCurrentUser();
  const canManageCollections = await isCollectionManager();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-6 py-12">
      <p className="text-sm text-muted-foreground">Authenticated workspace</p>
      <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
      <p className="text-muted-foreground">
        Your Clerk account is connected to your local profile.
      </p>
      {canManageCollections ? (
        <Link
          href="/dashboard/collections"
          className={`${buttonVariants()} w-fit`}
        >
          Manage collections
        </Link>
      ) : null}
    </main>
  );
}
