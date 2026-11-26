import { InfiniteGrid } from "@/features/landing/components/infinite-grid";
import { tmdbImage, tmdbSrcSet } from "@/lib/tmdb/images";
import { cn } from "@/lib/utils";

type Poster = { id: string; title: string; posterPath: string | null };

const MIN_PER_COLUMN = 7;
const DURATIONS = ["52s", "64s", "58s", "70s", "61s", "55s"];

const VARIANTS = {
  hero: {
    columns: 4,
    wrapper: "landing-wall--enter lg:left-auto lg:w-[70%]",
    grid: "grid-cols-3 lg:grid-cols-4",
    scrim: "bg-landing-bg/80 lg:bg-landing-bg/25",
  },
  // Muted full-width wall behind the final CTA, bookending the hero.
  backdrop: {
    columns: 6,
    wrapper: "landing-wall--backdrop",
    grid: "grid-cols-5 lg:grid-cols-6",
    scrim: "bg-landing-surface/85",
  },
} as const;

// Short libraries repeat posters so every column still overflows the hero.
function toColumns(posters: Poster[], count: number) {
  // Equal column lengths keep every column's wrap period identical.
  const needed =
    Math.ceil(Math.max(posters.length, count * MIN_PER_COLUMN) / count) * count;
  const columns: Poster[][] = Array.from({ length: count }, () => []);
  for (let i = 0; i < needed; i++) {
    columns[i % count]?.push(posters[i % posters.length] as Poster);
  }
  return columns;
}

function PosterImage({ poster }: { poster: Poster }) {
  return (
    <img
      src={tmdbImage(poster.posterPath, "w342") ?? undefined}
      srcSet={tmdbSrcSet(poster.posterPath, [185, 342])}
      sizes="(min-width: 1024px) 14vw, 30vw"
      alt=""
      loading="lazy"
      decoding="async"
      fetchPriority="low"
      draggable={false}
      className="aspect-[2/3] w-full bg-landing-raised object-cover"
    />
  );
}

export function PosterWall({
  posters,
  variant = "hero",
}: {
  posters: Poster[];
  variant?: keyof typeof VARIANTS;
}) {
  if (posters.length === 0) return null;
  const { columns, wrapper, grid, scrim } = VARIANTS[variant];
  const wall = toColumns(posters, columns);
  const draggable = variant === "hero";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "landing-wall absolute inset-0 overflow-hidden",
        !draggable && "pointer-events-none",
        wrapper,
      )}
    >
      {draggable ? (
        <InfiniteGrid
          gridClassName={grid}
          columns={wall.map((column) =>
            column.map((poster, index) => (
              <PosterImage key={`${poster.id}-${index}`} poster={poster} />
            )),
          )}
        />
      ) : (
        <div
          className={cn(
            "-top-1/4 absolute inset-x-0 grid h-[150%] rotate-[-8deg] scale-110 gap-3",
            grid,
          )}
        >
          {wall.map((column, columnIndex) => (
            <div
              key={DURATIONS[columnIndex]}
              className="landing-wall__column flex flex-col gap-3 last:hidden lg:last:flex"
              style={{
                ["--drift-duration" as string]: DURATIONS[columnIndex],
                marginTop: columnIndex % 2 ? "-12%" : 0,
              }}
            >
              {column.map((poster, index) => (
                <PosterImage key={`${poster.id}-${index}`} poster={poster} />
              ))}
            </div>
          ))}
        </div>
      )}
      <div className={cn("pointer-events-none absolute inset-0", scrim)} />
    </div>
  );
}
