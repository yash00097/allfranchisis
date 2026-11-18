import * as Sentry from "@sentry/nextjs";
import {
  ArrowRight,
  BookmarkCheck,
  Clapperboard,
  ListOrdered,
  Plus,
  Rows3,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { CollectionCard } from "@/components/collection-card";
import { landingFont } from "@/components/landing/font";
import { PosterWall } from "@/components/landing/poster-wall";
import { Reveal } from "@/components/landing/reveal";
import { TaglineReveal } from "@/components/landing/tagline-reveal";
import {
  getLandingData,
  listCollectionDiscovery,
  listCollectionGenres,
} from "@/lib/collections";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TITLE = "AllFranchisis · Every franchise in watch order";
const DESCRIPTION =
  "Curated collections that put the movies, series and animated spinoffs of each universe in one ordered list. Browse without an account.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

const ACCOUNT_LINE =
  "Browse without an account. Create an account to track your progress.";

const BENEFITS = [
  {
    icon: ListOrdered,
    title: "One watch order",
    body: "Every collection is ordered by hand, so you never have to guess what comes next.",
  },
  {
    icon: Clapperboard,
    title: "Movies, series and animation together",
    body: "Films, live action shows and animated entries from one universe sit in a single list.",
  },
  {
    icon: Rows3,
    title: "Seasons where they belong",
    body: "A series can be split into groups of seasons, each placed between the films it connects to.",
  },
  {
    icon: BookmarkCheck,
    title: "Track your place",
    body: "Mark a collection In Progress or Completed, and keep the ones you love in Favorites.",
  },
];

const STEPS = [
  {
    title: "Pick a universe",
    body: "Browse the collection grid or filter it by genre to find the franchise you want.",
  },
  {
    title: "Follow the order",
    body: "Open a collection and work through it from the first entry, with TMDB details for every title.",
  },
  {
    title: "Track where you are",
    body: "Create an account to mark collections In Progress or Completed and save your favorites.",
  },
];

const FAQ = [
  {
    q: "Do I need an account to browse?",
    a: "No. Every collection and title page is open to everyone. Create an account when you want to track your progress.",
  },
  {
    q: "What does an account add?",
    a: "With an account you can mark a collection In Progress or Completed and save collections to Favorites. Each list has its own page in your library.",
  },
  {
    q: "Can I watch movies or shows here?",
    a: "No. AllFranchisis is a guide to what to watch and in what order. It does not stream or sell video.",
  },
  {
    q: "Where does the movie and TV information come from?",
    a: "Titles, posters, release dates and ratings come from TMDB. The ratings you see are TMDB scores, not AllFranchisis reviews.",
  },
  {
    q: "Who decides the watch order?",
    a: "Collections are curated by hand. Each entry is placed in order by the AllFranchisis editor, not by an algorithm.",
  },
  {
    q: "How are TV series handled?",
    a: "A series can be split into groups of seasons. Each group gets its own place in the collection, so a show can sit between the films it connects to.",
  },
  {
    q: "Can I filter collections by genre?",
    a: "Yes. The Collections page has a genre bar, and choosing a genre shows only the collections tagged with it.",
  },
];

const TAGLINE = [
  "Some stories need one film.",
  "The best ones need a whole universe.",
  "We keep it in order.",
];

const CONTAINER = "mx-auto w-full max-w-7xl px-4 sm:px-6";
const SECTION = "py-16 sm:py-24";
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const plural = (count: number, one: string, many = `${one}s`) =>
  `${count.toLocaleString("en-US")} ${count === 1 ? one : many}`;

// Marketing page must still render when the catalog is unreachable.
async function loadLandingContent() {
  try {
    const [landing, discovery, genres] = await Promise.all([
      getLandingData(),
      listCollectionDiscovery(),
      listCollectionGenres(),
    ]);
    return { ...landing, discovery, genres };
  } catch (error) {
    Sentry.captureException(error);
    return null;
  }
}

function PrimaryCta({ className }: { className?: string }) {
  return (
    <Link
      href="/collections"
      prefetch
      className={cn(
        "button-md group inline-flex w-fit items-center gap-2 bg-primary px-3 py-2 text-primary-foreground transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:opacity-90 active:scale-[0.98]",
        FOCUS,
        className,
      )}
    >
      Explore collections
      <ArrowRight
        aria-hidden="true"
        className="size-4 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1"
      />
    </Link>
  );
}

function SectionHeading({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex max-w-[680px] flex-col gap-3">
      <p className="caption-3 uppercase tracking-widest text-primary">
        {kicker}
      </p>
      <h2 className="heading-4 sm:heading-3 text-landing-fg">{title}</h2>
      {children ? (
        <p className="body-3 text-landing-muted">{children}</p>
      ) : null}
    </div>
  );
}

function CollectionRow({
  collections,
}: {
  collections: Parameters<typeof CollectionCard>[0]["collection"][];
}) {
  return (
    <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
      {collections.map((collection) => (
        <div
          key={collection.slug}
          className="w-[70%] shrink-0 snap-start sm:w-auto"
        >
          <CollectionCard collection={collection} />
        </div>
      ))}
    </div>
  );
}

export default async function HomePage() {
  const content = await loadLandingContent();
  const stats = content?.stats;
  const proof = stats
    ? [
        plural(stats.collectionCount, "collection"),
        plural(stats.movieCount, "movie"),
        plural(stats.showCount, "TV series", "TV series"),
      ].filter(
        (_, index) =>
          [stats.collectionCount, stats.movieCount, stats.showCount][index],
      )
    : [];
  const featured = content?.featured;
  const recent = content?.discovery.recentlyUpdated ?? [];
  const favorites = content?.discovery.mostFavorited ?? [];
  const genres = content?.genres ?? [];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <div
      className={cn(
        landingFont.className,
        "landing-page bg-landing-bg text-landing-fg",
      )}
    >
      <a
        href="#main"
        className={cn(
          "button-sm sr-only z-[60] bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-4",
          FOCUS,
        )}
      >
        Skip to content
      </a>

      <main id="main">
        <section className="relative overflow-hidden border-landing-line border-b">
          <PosterWall posters={content?.posters ?? []} />
          <div
            className={cn(
              CONTAINER,
              "relative flex min-h-dvh flex-col justify-center gap-6 pt-32 pb-24",
            )}
          >
            <p
              className="landing-enter caption-3 uppercase tracking-widest text-primary"
              style={{ ["--enter-step" as string]: 0 }}
            >
              Curated watch orders
            </p>
            <h1
              className="landing-enter landing-hero-heading heading-4 sm:heading-2 lg:heading-1 max-w-[680px] pb-1"
              style={{ ["--enter-step" as string]: 1 }}
            >
              Every franchise,
              <br />
              in the order it was{" "}
              <span className="whitespace-nowrap">meant to be watched.</span>
            </h1>
            <p
              className="landing-enter title-2 max-w-[680px] text-landing-muted"
              style={{ ["--enter-step" as string]: 2 }}
            >
              AllFranchisis gathers the movies, series and animated spinoffs of
              each universe into one curated collection. You always know what
              comes next.
            </p>
            <div
              className="landing-enter flex flex-col gap-4 pt-2"
              style={{ ["--enter-step" as string]: 3 }}
            >
              <PrimaryCta />
              {proof.length > 0 ? (
                <p className="caption-5 text-landing-muted">
                  {proof.join(" · ")}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        {recent.length > 0 ? (
          <section className={SECTION} aria-labelledby="recent-heading">
            <Reveal className={cn(CONTAINER, "flex flex-col gap-8")}>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2
                  id="recent-heading"
                  className="heading-5 sm:heading-4 text-landing-fg"
                >
                  Recently added and updated
                </h2>
                <Link
                  href="/collections"
                  className={cn(
                    "button-sm inline-flex items-center gap-1 text-landing-muted transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-landing-fg",
                    FOCUS,
                  )}
                >
                  See all collections
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
              <CollectionRow collections={recent} />
            </Reveal>
          </section>
        ) : null}

        <section
          className={cn(SECTION, "bg-landing-surface")}
          aria-labelledby="order-heading"
        >
          <Reveal
            className={cn(
              CONTAINER,
              "grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16",
            )}
          >
            <div className="flex flex-col gap-6">
              <div className="flex max-w-[680px] flex-col gap-3">
                <p className="caption-3 uppercase tracking-widest text-primary">
                  The problem
                </p>
                <h2
                  id="order-heading"
                  className="heading-4 sm:heading-3 text-landing-fg"
                >
                  Sequels, spinoffs, reboots.
                  <br />
                  One list untangles them.
                </h2>
              </div>
              <p className="body-3 max-w-[560px] text-landing-muted">
                Big universes spread across years of films, several series and
                animated side stories. Release dates alone rarely tell you where
                to start. A collection puts every entry in one place, in the
                order an editor picked for watching.
              </p>
              {featured ? (
                <Link
                  href={`/collections/${featured.slug}`}
                  className={cn(
                    "button-sm inline-flex w-fit items-center gap-1 text-landing-fg underline-offset-4 hover:underline",
                    FOCUS,
                  )}
                >
                  Open the full {featured.name} collection
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              ) : null}
            </div>

            {featured && featured.media.length > 0 ? (
              <figure className="flex flex-col gap-3 border border-landing-line bg-landing-bg p-4 sm:p-6">
                <figcaption className="flex items-baseline justify-between gap-4">
                  <span className="title-3 text-landing-fg">
                    {featured.name}
                  </span>
                  <span className="caption-5 text-landing-muted">
                    {plural(featured._count.media, "entry", "entries")}
                  </span>
                </figcaption>
                <ol className="flex flex-col">
                  {featured.media.map(({ mediaItem }, index) => (
                    <li
                      key={mediaItem.id}
                      className="flex items-center gap-4 border-landing-line border-t py-3"
                    >
                      <span className="caption-3 w-6 text-primary tabular-nums">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="title-4 min-w-0 flex-1 truncate text-landing-fg">
                        {mediaItem.title}
                      </span>
                      <span className="caption-5 hidden text-landing-muted sm:inline">
                        {mediaItem.isAnimated ? "Animated " : ""}
                        {mediaItem.mediaType === "MOVIE" ? "movie" : "TV show"}
                      </span>
                      <span className="caption-5 w-10 text-right text-landing-muted tabular-nums">
                        {mediaItem.releaseDate?.getUTCFullYear() ?? "TBA"}
                      </span>
                    </li>
                  ))}
                </ol>
              </figure>
            ) : null}
          </Reveal>
        </section>

        <section className={SECTION} aria-labelledby="benefits-heading">
          <Reveal className={cn(CONTAINER, "flex flex-col gap-12")}>
            <SectionHeading
              kicker="Why it helps"
              title={<span id="benefits-heading">Know what comes next</span>}
            >
              Everything a franchise needs to be watched in sequence, in one
              place.
            </SectionHeading>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {BENEFITS.map(({ icon: Icon, title, body }) => (
                <li
                  key={title}
                  className="flex flex-col gap-4 border border-landing-line bg-landing-surface p-6 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1"
                >
                  <span className="flex size-10 items-center justify-center bg-primary text-primary-foreground">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <h3 className="heading-6 text-landing-fg">{title}</h3>
                  <p className="body-6 text-landing-muted">{body}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        <section className="py-24" aria-label="What we do">
          <div className={cn(CONTAINER, "min-h-[60vh] content-center")}>
            <TaglineReveal lines={TAGLINE} />
          </div>
        </section>

        <section
          className={cn(SECTION, "bg-landing-surface")}
          aria-labelledby="steps-heading"
        >
          <Reveal className={cn(CONTAINER, "flex flex-col gap-12")}>
            <SectionHeading
              kicker="How it works"
              title={<span id="steps-heading">Three steps to the start</span>}
            />
            <ol className="grid gap-4 md:grid-cols-3">
              {STEPS.map(({ title, body }, index) => (
                <li
                  key={title}
                  className="flex flex-col gap-3 border border-landing-line bg-landing-bg p-6"
                >
                  <span className="heading-3 text-primary tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="heading-6 text-landing-fg">{title}</h3>
                  <p className="body-6 text-landing-muted">{body}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </section>

        {stats && stats.collectionCount > 0 ? (
          <section className={SECTION} aria-labelledby="library-heading">
            <Reveal className={cn(CONTAINER, "flex flex-col gap-12")}>
              <SectionHeading
                kicker="The library"
                title={<span id="library-heading">What is inside today</span>}
              >
                Live counts from the catalog. They grow as new collections are
                curated.
              </SectionHeading>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  ["Collections", stats.collectionCount],
                  ["Movies", stats.movieCount],
                  ["TV series", stats.showCount],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex flex-col gap-2 border border-landing-line bg-landing-surface p-6"
                  >
                    <dt className="title-4 text-landing-muted">{label}</dt>
                    <dd className="heading-2 text-landing-fg tabular-nums">
                      {value.toLocaleString("en-US")}
                    </dd>
                  </div>
                ))}
              </dl>

              {genres.length > 0 ? (
                <div className="flex flex-col gap-4">
                  <h3 className="title-3 text-landing-fg">Browse by genre</h3>
                  <ul className="flex flex-wrap gap-2">
                    {genres.map((genre) => (
                      <li key={genre}>
                        <Link
                          href={`/collections?genre=${encodeURIComponent(genre)}`}
                          className={cn(
                            "button-sm inline-block border border-primary px-3 py-2 text-landing-fg transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-primary hover:text-primary-foreground active:scale-[0.98]",
                            FOCUS,
                          )}
                        >
                          {genre}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {favorites.length > 0 ? (
                <div className="flex flex-col gap-6">
                  <h3 className="title-3 text-landing-fg">
                    Most favorited by members
                  </h3>
                  <CollectionRow collections={favorites} />
                </div>
              ) : null}
            </Reveal>
          </section>
        ) : null}

        <section
          className={cn(SECTION, "bg-landing-surface")}
          aria-labelledby="faq-heading"
        >
          <Reveal
            className={cn(
              CONTAINER,
              "grid grid-cols-1 gap-12 lg:grid-cols-[1fr_2fr]",
            )}
          >
            <SectionHeading
              kicker="FAQ"
              title={<span id="faq-heading">Questions, answered</span>}
            />
            <div className="flex flex-col gap-2">
              {FAQ.map(({ q, a }) => (
                <details
                  key={q}
                  className="group border border-landing-line bg-landing-bg"
                >
                  <summary
                    className={cn(
                      "title-3 flex cursor-pointer list-none items-center justify-between gap-4 p-4 text-landing-fg [&::-webkit-details-marker]:hidden",
                      FOCUS,
                    )}
                  >
                    {q}
                    <Plus
                      aria-hidden="true"
                      className="size-5 shrink-0 text-primary transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-open:rotate-45"
                    />
                  </summary>
                  <p className="body-6 px-4 pb-4 text-landing-muted">{a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </section>

        <section className="py-24" aria-labelledby="final-heading">
          <Reveal className={cn(CONTAINER, "flex flex-col items-start gap-6")}>
            <h2
              id="final-heading"
              className="landing-hero-heading heading-3 sm:heading-2 max-w-[680px] pb-1"
            >
              Pick a universe.
              <br />
              Start at the beginning.
            </h2>
            <p className="title-2 max-w-[680px] text-landing-muted">
              {ACCOUNT_LINE}
            </p>
            <PrimaryCta />
          </Reveal>
        </section>
      </main>

      <footer className="border-landing-line border-t bg-landing-surface">
        <div
          className={cn(
            CONTAINER,
            "flex flex-col gap-6 py-12 sm:flex-row sm:items-start sm:justify-between",
          )}
        >
          <div className="flex max-w-md flex-col gap-2">
            <p className="title-3 text-landing-fg">
              <span className="text-primary">All</span>Franchisis
            </p>
            <p className="caption-5 text-landing-muted">
              Movie and TV data from TMDB. This product uses the TMDB API but is
              not endorsed or certified by TMDB.
            </p>
          </div>
          <nav aria-label="Footer" className="flex gap-1">
            <Link
              href="/collections"
              className={cn(
                "button-sm px-3 py-2 text-landing-muted hover:text-landing-fg",
                FOCUS,
              )}
            >
              Collections
            </Link>
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noreferrer"
              className={cn(
                "button-sm px-3 py-2 text-landing-muted hover:text-landing-fg",
                FOCUS,
              )}
            >
              TMDB
            </a>
          </nav>
        </div>
      </footer>

      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static FAQ JSON-LD; "<" escaped per Next.js JSON-LD guidance.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c"),
        }}
      />
    </div>
  );
}
