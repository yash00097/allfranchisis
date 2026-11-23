import { auth } from "@clerk/nextjs/server";
import { PAGE_MAIN_CLASS, PageHeader } from "@/components/page-header";
import { CollectionBrowser } from "@/features/collections/components/collection-browser";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCollectionFavorites } from "@/features/library/favorites/queries";
import { listUserCollectionsByStatus } from "@/features/library/watch-status/queries";

export const dynamic = "force-dynamic";

export default async function WatchingPage() {
  await auth.protect();
  const user = await getCurrentUser();
  const collections = user
    ? await listUserCollectionsByStatus({
        userId: user.id,
        status: "WATCHING",
      })
    : [];
  const favorites = user
    ? await getCollectionFavorites({
        userId: user.id,
        collectionIds: collections.map((collection) => collection.id),
      })
    : new Set<string>();

  return (
    <main className={PAGE_MAIN_CLASS}>
      <PageHeader
        kicker="Your library"
        title="In Progress"
        description="Collections you are working through"
      />
      <CollectionBrowser
        collections={collections.map((collection) => ({
          ...collection,
          status: "WATCHING" as const,
          isFavorite: favorites.has(collection.id),
        }))}
        emptyTitle="Nothing in progress"
        emptyDescription="Open a collection and mark it as In Progress to see it here."
      />
    </main>
  );
}
