import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionBrowser } from "@/components/collection-browser";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCollectionFavorites } from "@/lib/favorites/queries";
import { getFranchiseBySlug } from "@/lib/franchises/queries";
import { resolveImage, tmdbSrcSet } from "@/lib/tmdb/images";
import { getCollectionStatuses } from "@/lib/watch-status/queries";
import type { WatchStatus } from "@/lib/watch-status/types";

export const dynamic = "force-dynamic";

type FranchisePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function FranchisePage({ params }: FranchisePageProps) {
  const { slug } = await params;
  const [franchise, user] = await Promise.all([
    getFranchiseBySlug(slug),
    getCurrentUser(),
  ]);
  if (!franchise) notFound();

  const collections = franchise.collections.map(({ collection }) => collection);
  const collectionIds = collections.map((collection) => collection.id);
  const [statuses, favorites] = user
    ? await Promise.all([
        getCollectionStatuses({ userId: user.id, collectionIds }),
        getCollectionFavorites({ userId: user.id, collectionIds }),
      ])
    : [new Map<string, WatchStatus>(), new Set<string>()];
  const collectionsWithStatus = collections.map((collection) => ({
    ...collection,
    status: statuses.get(collection.id) ?? null,
    isFavorite: user ? favorites.has(collection.id) : undefined,
  }));
  const backdrop = resolveImage(franchise.backdropUrl, "w1280");
  const cover = resolveImage(franchise.coverImageUrl, "w780");
  const count = collections.length;

  return (
    <main className="flex flex-1 flex-col">
      <section className="relative isolate overflow-hidden border-b">
        {backdrop ? (
          <img
            src={backdrop}
            srcSet={tmdbSrcSet(franchise.backdropUrl, [780, 1280])}
            sizes="100vw"
            fetchPriority="high"
            alt=""
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 -z-10 bg-background/85" />
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10 lg:flex-row lg:items-end lg:py-16">
          {cover ? (
            <img
              src={cover}
              fetchPriority="high"
              alt={`${franchise.name} cover`}
              className="aspect-2/3 w-40 object-contain shadow-lg"
            />
          ) : null}
          <div className="flex flex-col gap-4">
            <Link
              href="/franchises"
              className={`${buttonVariants({ variant: "ghost" })} w-fit px-0`}
            >
              <ArrowLeft /> All franchises
            </Link>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {count} {count === 1 ? "collection" : "collections"}
              </Badge>
            </div>
            <h1 className="font-heading text-4xl font-bold tracking-tight lg:text-6xl">
              {franchise.name}
            </h1>
            <p className="max-w-3xl text-muted-foreground">
              {franchise.description}
            </p>
          </div>
        </div>
      </section>
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-10">
        {count ? (
          <CollectionBrowser
            collections={collectionsWithStatus}
            emptyTitle="No collections in this franchise"
            emptyDescription="Try a different collection name."
          />
        ) : (
          <p className="border p-6 text-muted-foreground">
            This franchise has no collections yet.
          </p>
        )}
      </div>
    </main>
  );
}
