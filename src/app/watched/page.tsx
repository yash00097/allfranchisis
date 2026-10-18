import { auth } from "@clerk/nextjs/server";
import { CollectionBrowser } from "@/components/collection-browser";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listUserCollectionsByStatus } from "@/lib/watch-status/queries";

export const dynamic = "force-dynamic";

export default async function WatchedPage() {
  await auth.protect();
  const user = await getCurrentUser();
  const collections = user
    ? (
        await listUserCollectionsByStatus({
          userId: user.id,
          status: "WATCHED",
        })
      ).map((collection) => ({ ...collection, status: "WATCHED" as const }))
    : [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">
          Your library
        </p>
        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          Completed
        </h1>
        <p className="text-muted-foreground">Collections you have finished.</p>
      </header>
      <CollectionBrowser
        collections={collections}
        emptyTitle="Nothing completed yet"
        emptyDescription="Open a collection and mark it as Completed to see it here."
      />
    </main>
  );
}
