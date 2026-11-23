import Link from "next/link";
import { cn } from "cn";
import { AutoScrollRow } from "@/components/auto-scroll-row";
import type { CollectionGenre } from "@/features/collections/genres";

const chipClass =
  "shrink-0 whitespace-nowrap border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function GenreFilterBar({
  genres,
  activeGenre,
}: {
  genres: CollectionGenre[];
  activeGenre: CollectionGenre | null;
}) {
  if (!genres.length) return null;

  return (
    <nav aria-label="Filter collections by genre" className="-mx-6 px-6">
      <AutoScrollRow>
        {genres.map((genre) => (
          <GenreChip
            key={genre}
            href={`/collections?genre=${encodeURIComponent(genre)}`}
            label={genre}
            active={activeGenre === genre}
          />
        ))}
      </AutoScrollRow>
    </nav>
  );
}

function GenreChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        chipClass,
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-foreground/15 text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}
