import Link from "next/link";
import { cn } from "cn";
import { tmdbImage, tmdbSrcSet } from "@/lib/tmdb/images";
import { WATCH_STATUS_LABELS } from "@/features/library/watch-status/types";

type CollectionCardProps = {
  collection: {
    slug: string;
    name: string;
    genres: string[];
    coverImageUrl: string | null;
    _count: { media: number };
    status?: "WATCHING" | "WATCHED" | null;
    isFavorite?: boolean;
  };
  imagePriority?: ImagePriority;
};

type ImagePriority = "high" | "eager" | "lazy";

const IMAGE_LOADING = {
  high: { loading: "eager", fetchPriority: "high" },
  eager: { loading: "eager" },
  lazy: { loading: "lazy", decoding: "async" },
} as const;

// Cards are laid out 70% (phone) / 3 / 4 per row inside max-w-7xl minus px-6.
const COVER_SIZES =
  "(min-width: 1280px) 293px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 70vw";

// First visible row loads eagerly; card 0 is the measured LCP element on /collections.
export const imagePriorityFor = (index: number): ImagePriority =>
  index === 0 ? "high" : index < 4 ? "eager" : "lazy";

export function CollectionCard({
  collection,
  imagePriority = "lazy",
}: CollectionCardProps) {
  const href = `/collections/${collection.slug}`;
  const count = collection._count.media;
  const isTmdbPath = !collection.coverImageUrl?.startsWith("http");
  const image = isTmdbPath
    ? tmdbImage(collection.coverImageUrl, "w780")
    : collection.coverImageUrl;

  return (
    <Link
      href={href}
      prefetch
      className="group flex flex-col gap-3 outline-none"
    >
      <div className="aspect-[2/3] overflow-hidden bg-muted ring-1 ring-foreground/10 transition-[box-shadow] group-hover:ring-foreground/40 group-focus-visible:ring-2 group-focus-visible:ring-ring">
        {image ? (
          <img
            src={image}
            {...IMAGE_LOADING[imagePriority]}
            {...(isTmdbPath && {
              srcSet: tmdbSrcSet(collection.coverImageUrl, [342, 500, 780]),
              sizes: COVER_SIZES,
              width: 500,
              height: 750,
            })}
            alt=""
            className="size-full object-contain"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
            No cover image
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg leading-snug font-medium transition-colors group-hover:text-primary">
          {collection.name}
        </h2>
        <p className="flex items-center gap-2 font-mono text-xs text-muted-foreground tabular-nums">
          <span>
            {count} {count === 1 ? "title" : "titles"}
          </span>
          {collection.status ? (
            <span className="flex items-center gap-1.5 font-sans">
              <span
                aria-hidden="true"
                className={cn(
                  "size-1.5",
                  collection.status === "WATCHING"
                    ? "bg-primary"
                    : "bg-muted-foreground",
                )}
              />
              {WATCH_STATUS_LABELS[collection.status]}
            </span>
          ) : null}
        </p>
        {collection.genres.length ? (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {collection.genres.join(" · ")}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
