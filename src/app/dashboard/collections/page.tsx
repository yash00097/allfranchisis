import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { CollectionManager } from "@/components/collection-manager";
import { buttonVariants } from "@/components/ui/button";
import { isCollectionManager } from "@/lib/auth/collection-manager";
import { listCollectionsForManager } from "@/lib/collections";

export const dynamic = "force-dynamic";

export default async function ManageCollectionsPage() {
  await auth.protect();
  const canManageCollections = await isCollectionManager();

  if (!canManageCollections) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-5 px-6 py-16 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Owner workspace
        </p>
        <h1 className="font-heading text-3xl font-bold">
          Collection management is owner-only
        </h1>
        <p className="text-muted-foreground">
          This area is reserved for the collection owner. You can still browse
          all published collections from the public discovery page.
        </p>
        <Link href="/collections" className={buttonVariants()}>
          Browse collections
        </Link>
      </main>
    );
  }

  const collections = await listCollectionsForManager();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Manager workspace
        </p>
        <h1 className="font-heading text-4xl font-bold tracking-tight">
          Manage collections
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Create curated collections and add movies or TV shows from TMDB.
        </p>
      </header>
      <CollectionManager
        collections={collections.map((collection) => ({
          id: collection.id,
          name: collection.name,
          slug: collection.slug,
          description: collection.description,
          coverImageUrl: collection.coverImageUrl,
          backdropUrl: collection.backdropUrl,
          media: collection.media.map(({ mediaItem }) => ({
            id: mediaItem.id,
            tmdbId: mediaItem.tmdbId,
            mediaType: mediaItem.mediaType,
            title: mediaItem.title,
            posterPath: mediaItem.posterPath,
          })),
        }))}
      />
    </main>
  );
}
