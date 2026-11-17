import { ArrowLeft, Film, Tv } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionFavoriteButton } from "@/components/collection-favorite-button";
import { CollectionMediaBrowser } from "@/components/collection-media-browser";
import { CollectionStatusControl } from "@/components/collection-status-control";
import { GenreBadges } from "@/components/genre-badges";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCollectionBySlug } from "@/lib/collections";
import { getCollectionFavorite } from "@/lib/favorites/queries";
import { tmdbImage } from "@/lib/tmdb";
import { getCollectionStatus } from "@/lib/watch-status/queries";

export const dynamic = "force-dynamic";

type CollectionPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const user = await getCurrentUser();
  const [viewerStatus, isFavorite] = user
    ? await Promise.all([
        getCollectionStatus({ userId: user.id, collectionId: collection.id }),
        getCollectionFavorite({ userId: user.id, collectionId: collection.id }),
      ])
    : [null, false];

  const media = collection.media
    .flatMap(({ mediaItem, displayOrder, seasonGroups }) =>
      seasonGroups.length
        ? seasonGroups.map((group) => ({
            ...mediaItem,
            displayKey: `group:${group.id}`,
            displayOrder: group.displayOrder,
            seasonLabel:
              group.seasons.length === 1
                ? group.seasons[0].seasonNumber === 0
                  ? "Specials"
                  : `Season ${group.seasons[0].seasonNumber}`
                : `Seasons ${Math.min(
                    ...group.seasons.map((season) => season.seasonNumber),
                  )}-${Math.max(
                    ...group.seasons.map((season) => season.seasonNumber),
                  )}`,
          }))
        : [
            {
              ...mediaItem,
              displayKey: `media:${mediaItem.id}`,
              displayOrder,
              seasonLabel: "",
            },
          ],
    )
    .sort((left, right) => left.displayOrder - right.displayOrder);
  const movies = media.filter((item) => item.mediaType === "MOVIE").length;
  const shows = media.filter((item) => item.mediaType === "TV").length;
  const backdrop = collection.backdropUrl?.startsWith("http")
    ? collection.backdropUrl
    : tmdbImage(collection.backdropUrl, "original");
  const cover = collection.coverImageUrl?.startsWith("http")
    ? collection.coverImageUrl
    : tmdbImage(collection.coverImageUrl, "w780");

  return (
    <main className="flex flex-1 flex-col">
      <section className="relative isolate overflow-hidden border-b">
        {backdrop ? (
          <img
            src={backdrop}
            alt=""
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 -z-10 bg-background/85" />
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10 lg:flex-row lg:items-end lg:py-16">
          {cover ? (
            <img
              src={cover}
              alt={`${collection.name} cover`}
              className="aspect-2/3 w-40 object-contain shadow-lg"
            />
          ) : null}
          <div className="flex flex-col gap-4">
            <Link
              href="/collections"
              className={`${buttonVariants({ variant: "ghost" })} w-fit px-0`}
            >
              <ArrowLeft /> All collections
            </Link>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{media.length} items</Badge>
              <Badge variant="outline">
                <Film /> {movies} movies
              </Badge>
              <Badge variant="outline">
                <Tv /> {shows} shows
              </Badge>
            </div>
            <GenreBadges genres={collection.genres} />
            <div className="flex items-start gap-4">
              <h1 className="font-heading text-4xl font-bold tracking-tight lg:text-6xl">
                {collection.name}
              </h1>
              {user ? (
                <CollectionFavoriteButton
                  slug={collection.slug}
                  name={collection.name}
                  isFavorite={isFavorite}
                />
              ) : null}
            </div>
            <p className="max-w-3xl text-muted-foreground">
              {collection.description}
            </p>
            <CollectionStatusControl
              slug={collection.slug}
              status={viewerStatus}
              isSignedIn={user !== null}
            />
          </div>
        </div>
      </section>
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-10">
        {media.length ? (
          <CollectionMediaBrowser
            media={media}
            collectionSlug={collection.slug}
          />
        ) : (
          <p className="border p-8 text-center text-muted-foreground">
            This collection has no media yet.
          </p>
        )}
      </div>
    </main>
  );
}
