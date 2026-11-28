import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { isCollectionManager } from "@/lib/auth/collection-manager";
import { getCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await auth.protect();
  const user = await getCurrentUser();
  const canManageCollections = await isCollectionManager();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-6 py-12">
      <p className="text-sm text-muted-foreground">Authenticated workspace</p>
      <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
      <p className="text-muted-foreground">
        Your Clerk account is connected to your local profile.
      </p>
      {canManageCollections ? (
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/collections"
            className={`${buttonVariants()} w-fit`}
          >
            Manage collections
          </Link>
          <Link
            href="/dashboard/franchises"
            className={`${buttonVariants({ variant: "outline" })} w-fit`}
          >
            Manage franchises (beta)
          </Link>
        </div>
      ) : null}
    </main>
  );
}
