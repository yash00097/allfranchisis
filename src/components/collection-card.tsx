import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { tmdbImage } from "@/lib/tmdb/images";

type CollectionCardProps = {
  collection: {
    slug: string;
    name: string;
    description: string;
    coverImageUrl: string | null;
    _count: { media: number };
  };
};

export function CollectionCard({ collection }: CollectionCardProps) {
  const image = collection.coverImageUrl?.startsWith("http")
    ? collection.coverImageUrl
    : tmdbImage(collection.coverImageUrl, "w780");

  return (
    <Link href={`/collections/${collection.slug}`} className="group block">
      <Card className="h-full transition-transform duration-200 group-hover:-translate-y-1">
        <div className="aspect-[16/10] overflow-hidden bg-muted">
          {image ? (
            <img
              src={image}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No cover image
            </div>
          )}
        </div>
        <CardContent className="flex flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-heading text-xl font-semibold">
              {collection.name}
            </h2>
            <span className="shrink-0 text-xs text-muted-foreground">
              {collection._count.media} items
            </span>
          </div>
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {collection.description}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
