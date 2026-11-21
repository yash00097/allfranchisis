import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { resolveImage, tmdbSrcSet } from "@/lib/tmdb/images";

type ImagePriority = "high" | "eager" | "lazy";

type FranchiseCardProps = {
  franchise: {
    slug: string;
    name: string;
    description: string;
    coverImageUrl: string | null;
    _count: { collections: number };
  };
  imagePriority?: ImagePriority;
};

const IMAGE_LOADING = {
  high: { loading: "eager", fetchPriority: "high" },
  eager: { loading: "eager" },
  lazy: { loading: "lazy", decoding: "async" },
} as const;

// Same grid as CollectionBrowser: 70% (phone) / 3 / 4 per row.
const COVER_SIZES =
  "(min-width: 1280px) 293px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 70vw";

export function FranchiseCard({
  franchise,
  imagePriority = "lazy",
}: FranchiseCardProps) {
  const href = `/franchises/${franchise.slug}`;
  const image = resolveImage(franchise.coverImageUrl, "w780");
  const srcSet = tmdbSrcSet(franchise.coverImageUrl, [342, 500, 780]);
  const count = franchise._count.collections;

  return (
    <Card className="self-start">
      <Link href={href} prefetch className="group block">
        <div className="flex justify-center bg-muted">
          {image ? (
            <img
              src={image}
              {...IMAGE_LOADING[imagePriority]}
              {...(srcSet && {
                srcSet,
                sizes: COVER_SIZES,
                width: 500,
                height: 750,
              })}
              alt=""
              className="block h-auto w-full object-contain"
            />
          ) : (
            <div className="flex min-h-32 w-full items-center justify-center text-sm text-muted-foreground">
              No cover image
            </div>
          )}
        </div>
        <CardContent className="flex flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-heading text-xl font-semibold">
              {franchise.name}
            </h2>
            <span className="shrink-0 text-xs text-muted-foreground">
              {count} {count === 1 ? "collection" : "collections"}
            </span>
          </div>
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {franchise.description}
          </p>
        </CardContent>
      </Link>
    </Card>
  );
}
