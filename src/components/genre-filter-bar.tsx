import Link from "next/link";
import { cn } from "cn";
import type { CollectionGenre } from "@/lib/collections/genres";

const chipClass =
  "shrink-0 whitespace-nowrap border px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition-colors";

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
      <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
        <GenreChip
          href="/collections"
          label="All"
          active={activeGenre === null}
        />
        {genres.map((genre) => (
          <GenreChip
            key={genre}
            href={`/collections?genre=${encodeURIComponent(genre)}`}
            label={genre}
            active={activeGenre === genre}
          />
        ))}
      </div>
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
          : "border-primary/50 text-primary hover:bg-primary/10",
      )}
    >
      {label}
    </Link>
  );
}
