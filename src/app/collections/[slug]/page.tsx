import { ArrowLeft, Film, Tv } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionMediaBrowser } from "@/components/collection-media-browser";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getCollectionBySlug } from "@/lib/collections";
import { tmdbImage } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

type CollectionPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const media = collection.media.map(({ mediaItem }) => mediaItem);
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
            <h1 className="font-heading text-4xl font-bold tracking-tight lg:text-6xl">
              {collection.name}
            </h1>
            <p className="max-w-3xl text-muted-foreground">
              {collection.description}
            </p>
          </div>
        </div>
      </section>
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-10">
        {media.length ? (
          <CollectionMediaBrowser media={media} />
        ) : (
          <p className="border p-8 text-center text-muted-foreground">
            This collection has no media yet.
          </p>
        )}
      </div>
    </main>
  );
}
