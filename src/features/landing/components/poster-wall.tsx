import { tmdbImage, tmdbSrcSet } from "@/lib/tmdb/images";

type Poster = { id: string; title: string; posterPath: string | null };

const COLUMN_COUNT = 4;
const MIN_PER_COLUMN = 7;
const DURATIONS = ["52s", "64s", "58s", "70s"];

// Short libraries repeat posters so every column still overflows the hero.
function toColumns(posters: Poster[]) {
  const needed = Math.max(posters.length, COLUMN_COUNT * MIN_PER_COLUMN);
  const columns: Poster[][] = Array.from({ length: COLUMN_COUNT }, () => []);
  for (let i = 0; i < needed; i++) {
    columns[i % COLUMN_COUNT]?.push(posters[i % posters.length] as Poster);
  }
  return columns;
}

export function PosterWall({ posters }: { posters: Poster[] }) {
  if (posters.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="landing-wall pointer-events-none absolute inset-0 overflow-hidden lg:left-auto lg:w-1/2"
    >
      <div className="-top-1/4 absolute inset-x-0 grid h-[150%] rotate-[-8deg] scale-110 grid-cols-3 gap-3 lg:grid-cols-4">
        {toColumns(posters).map((column, columnIndex) => (
          <div
            key={DURATIONS[columnIndex]}
            className="landing-wall__column flex flex-col gap-3 last:hidden lg:last:flex"
            style={{
              ["--drift-duration" as string]: DURATIONS[columnIndex],
              marginTop: columnIndex % 2 ? "-12%" : 0,
            }}
          >
            {column.map((poster, index) => (
              <img
                key={`${poster.id}-${index}`}
                src={tmdbImage(poster.posterPath, "w342") ?? undefined}
                srcSet={tmdbSrcSet(poster.posterPath, [185, 342])}
                sizes="(min-width: 1024px) 14vw, 30vw"
                alt=""
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                className="aspect-[2/3] w-full bg-landing-raised object-cover"
              />
            ))}
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-landing-bg/80 lg:bg-landing-bg/25" />
    </div>
  );
}
