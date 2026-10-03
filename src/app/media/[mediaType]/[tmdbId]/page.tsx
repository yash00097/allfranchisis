import { ArrowLeft, CalendarDays, Clapperboard, Tv } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  getMovieDetails,
  getTvDetails,
  getTvSeasonDetails,
  tmdbImage,
} from "@/lib/tmdb";

export const revalidate = 3600;

type MediaPageProps = {
  params: Promise<{ mediaType: string; tmdbId: string }>;
  searchParams: Promise<{ season?: string }>;
};

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function formatDate(value: string | undefined) {
  if (!value) return "Unavailable";
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime())
    ? "Unavailable"
    : date.toLocaleDateString("en-US", {
        dateStyle: "medium",
        timeZone: "UTC",
      });
}

export default async function MediaPage({
  params,
  searchParams,
}: MediaPageProps) {
  const { mediaType, tmdbId: rawId } = await params;
  const id = parseId(rawId);
  if (!id || !["movie", "tv"].includes(mediaType)) notFound();

  if (mediaType === "movie") {
    const movie = await getMovieDetails(id);
    const backdrop = tmdbImage(movie.backdrop_path, "original");
    return (
      <MediaShell
        title={movie.title}
        backdrop={backdrop}
        poster={tmdbImage(movie.poster_path, "w500")}
      >
        <div className="flex flex-wrap gap-2">
          <Badge>
            <Clapperboard /> Movie
          </Badge>
          <Badge variant="outline">
            TMDB {movie.vote_average?.toFixed(1) ?? "N/A"}
          </Badge>
        </div>
        <p>{movie.overview || "No overview is available."}</p>
        <MediaFacts
          items={[
            ["Release date", formatDate(movie.release_date)],
            [
              "Runtime",
              movie.runtime ? `${movie.runtime} minutes` : "Unavailable",
            ],
            ["Vote count", String(movie.vote_count ?? "Unavailable")],
          ]}
        />
        <GenreList genres={movie.genres?.map((genre) => genre.name) ?? []} />
      </MediaShell>
    );
  }

  const tv = await getTvDetails(id);
  const { season: rawSeason } = await searchParams;
  const requestedSeason = Number(rawSeason ?? 1);
  const seasonNumber =
    Number.isInteger(requestedSeason) &&
    requestedSeason >= 0 &&
    requestedSeason <= (tv.number_of_seasons ?? 0)
      ? requestedSeason
      : 1;
  const season = await getTvSeasonDetails(id, seasonNumber);
  return (
    <MediaShell
      title={tv.name}
      backdrop={tmdbImage(tv.backdrop_path, "original")}
      poster={tmdbImage(tv.poster_path, "w500")}
    >
      <div className="flex flex-wrap gap-2">
        <Badge>
          <Tv /> TV show
        </Badge>
        <Badge variant="outline">
          TMDB {tv.vote_average?.toFixed(1) ?? "N/A"}
        </Badge>
      </div>
      <p>{tv.overview || "No overview is available."}</p>
      <MediaFacts
        items={[
          ["First air date", formatDate(tv.first_air_date)],
          ["Seasons", String(tv.number_of_seasons ?? "Unavailable")],
          ["Episodes", String(tv.number_of_episodes ?? "Unavailable")],
          ["Vote count", String(tv.vote_count ?? "Unavailable")],
        ]}
      />
      <GenreList genres={tv.genres?.map((genre) => genre.name) ?? []} />
      <section className="flex flex-col gap-4 border-t pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-2xl font-semibold">
            Season {season.season_number}
          </h2>
          <div className="flex flex-wrap gap-2">
            {Array.from(
              { length: tv.number_of_seasons ?? 0 },
              (_, index) => index + 1,
            ).map((number) => (
              <Link
                key={number}
                href={`/media/tv/${id}?season=${number}`}
                className={buttonVariants({
                  size: "sm",
                  variant: number === seasonNumber ? "default" : "outline",
                })}
              >
                {number}
              </Link>
            ))}
          </div>
        </div>
        <div className="grid gap-3">
          {season.episodes?.map((episode) => (
            <article key={episode.id} className="flex gap-4 border p-4">
              <div className="hidden aspect-video w-40 shrink-0 overflow-hidden bg-muted sm:block">
                {episode.still_path ? (
                  <img
                    src={tmdbImage(episode.still_path, "w300") ?? undefined}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground">
                  Episode {episode.episode_number} ·{" "}
                  {formatDate(episode.air_date)}
                </p>
                <h3 className="font-semibold">
                  {episode.name || "Untitled episode"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {episode.overview || "No episode overview is available."}
                </p>
                <p className="text-xs text-muted-foreground">
                  TMDB rating: {episode.vote_average?.toFixed(1) ?? "N/A"}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </MediaShell>
  );
}

function MediaShell({
  title,
  backdrop,
  poster,
  children,
}: {
  title: string;
  backdrop: string | null;
  poster: string | null;
  children: ReactNode;
}) {
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
        <div className="absolute inset-0 -z-10 bg-background/90" />
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10 lg:flex-row lg:items-end lg:py-16">
          {poster ? (
            <img
              src={poster}
              alt={`${title} poster`}
                    className="aspect-2/3 w-48 object-cover shadow-lg"
            />
          ) : null}
          <div className="flex max-w-3xl flex-col gap-4">
            <Link
              href="/collections"
              className={`${buttonVariants({ variant: "ghost" })} w-fit px-0`}
            >
              <ArrowLeft /> Back to collections
            </Link>
            <h1 className="font-heading text-4xl font-bold tracking-tight lg:text-6xl">
              {title}
            </h1>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}

function MediaFacts({ items }: { items: string[][] }) {
  return (
    <div className="grid gap-3 text-sm sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div
          key={label}
          className="flex items-center gap-2 text-muted-foreground"
        >
          <CalendarDays className="size-4" />{" "}
          <span>
            {label}: {value}
          </span>
        </div>
      ))}
    </div>
  );
}

function GenreList({ genres }: { genres: string[] }) {
  return genres.length ? (
    <div className="flex flex-wrap gap-2">
      {genres.map((genre) => (
        <Badge key={genre} variant="secondary">
          {genre}
        </Badge>
      ))}
    </div>
  ) : null;
}
