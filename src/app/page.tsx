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
import type { CSSProperties, ReactNode } from "react";
import { CollectionCard } from "@/features/collections/components/collection-card";
import { CountUp } from "@/features/landing/components/count-up";
import { landingFont, landingMono } from "@/features/landing/components/font";
import { PosterGallery } from "@/features/landing/components/poster-gallery";
import { PosterWall } from "@/features/landing/components/poster-wall";
import { Reveal } from "@/features/landing/components/reveal";
import { TaglineReveal } from "@/features/landing/components/tagline-reveal";
import {
  getLandingData,
  listCollectionDiscovery,
  listCollectionGenres,
} from "@/features/collections";
import { TmdbAttribution } from "@/components/tmdb-attribution";
import { tmdbImage } from "@/lib/tmdb/images";
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
  "The best ones need",
  "a whole universe.",
  "We keep it in order.",
];

const CONTAINER = "mx-auto w-full max-w-7xl px-4 sm:px-6";
const SECTION = "py-16 sm:py-24";
const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const QUIET_LINK = cn(
  "button-sm group inline-flex w-fit items-center gap-2 text-landing-muted transition-colors duration-300 hover:text-landing-fg",
  EASE,
  FOCUS,
);
// Mobile rails scroll edge to edge; wider screens switch to a grid.
const RAIL =
  "-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:overflow-visible sm:px-0";

const HERO_LINES = [
  "Every franchise,",
  "in the order it was",
  "meant to be watched.",
];

// Staggered children read their position from a CSS variable.
const cssVar = (name: string, value: number) =>
  ({ [name]: value }) as CSSProperties;
const stagger = (index: number) => cssVar("--i", index);

const pad = (n: number) => String(n).padStart(2, "0");
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

function PrimaryCta() {
  return (
    <Link
      href="/collections"
      prefetch
      className={cn(
        "button-md group inline-flex w-fit items-center gap-2 bg-primary px-3 py-2 text-primary-foreground transition-[opacity,transform] duration-300 hover:opacity-90 active:scale-[0.98]",
        EASE,
        FOCUS,
      )}
    >
      Explore collections
      <ArrowRight
        aria-hidden="true"
        className={cn(
          "size-4 transition-transform duration-300 group-hover:translate-x-1",
          EASE,
        )}
      />
    </Link>
  );
}

function ArrowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={QUIET_LINK}>
      {children}
      <ArrowRight
        aria-hidden="true"
        className={cn(
          "size-4 transition-transform duration-300 group-hover:translate-x-1",
          EASE,
        )}
      />
    </Link>
  );
}

function SectionHeading({
  id,
  title,
  children,
}: {
  id: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex max-w-[680px] flex-col gap-3">
      <h2 id={id} className="heading-4 sm:heading-3 text-landing-fg">
        {title}
      </h2>
      {children ? (
        <p className="body-3 text-landing-muted">{children}</p>
      ) : null}
    </div>
  );
}

function SectionTop({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      {children}
    </div>
  );
}

function CollectionRow({
  collections,
}: {
  collections: Parameters<typeof CollectionCard>[0]["collection"][];
}) {
  return (
    <div className={cn(RAIL, "sm:grid-cols-2 lg:grid-cols-4")}>
      {collections.map((collection, index) => (
        <div
          key={collection.slug}
          className="landing-stagger w-[70%] shrink-0 snap-start sm:w-auto"
          style={stagger(index)}
        >
          <CollectionCard collection={collection} />
        </div>
      ))}
    </div>
  );
}

type Featured = NonNullable<
  Awaited<ReturnType<typeof getLandingData>>["featured"]
>;

function WatchOrder({ featured }: { featured: Featured }) {
  const remaining = featured._count.media - featured.media.length;
  return (
    <div className="flex flex-col gap-6">
      <PosterGallery
        items={featured.media.map(({ mediaItem }) => ({
          id: mediaItem.id,
          title: mediaItem.title,
          poster: tmdbImage(mediaItem.posterPath, "w342"),
          year: String(mediaItem.releaseDate?.getUTCFullYear() ?? "TBA"),
          kind: `${mediaItem.isAnimated ? "Animated " : ""}${mediaItem.mediaType === "MOVIE" ? "movie" : "series"}`,
        }))}
      />
      <div className="flex flex-col gap-3 border-landing-line border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="caption-2 text-landing-muted">
          {featured.name}
          {remaining > 0
            ? ` continues with ${plural(remaining, "more entry", "more entries")}.`
            : "."}
        </p>
        <ArrowLink href={`/collections/${featured.slug}`}>
          Open the full collection
        </ArrowLink>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const content = await loadLandingContent();
  const stats = content?.stats;
  const statItems = stats
    ? (
        [
          ["Collections", stats.collectionCount, "collection", "collections"],
          ["Movies", stats.movieCount, "movie", "movies"],
          ["TV series", stats.showCount, "TV series", "TV series"],
        ] as const
      ).filter(([, value]) => value > 0)
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
        landingMono.variable,
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

      <div
        aria-hidden="true"
        className="landing-progress fixed inset-x-0 top-0 z-[70] h-0.5 bg-primary"
      />

      <main id="main">
        <section className="relative overflow-hidden border-landing-line border-b">
          <PosterWall posters={content?.posters ?? []} />
          <div
            className={cn(
              CONTAINER,
              "landing-hero-exit pointer-events-none relative lg:mx-0 lg:max-w-none lg:pl-[7vw] flex min-h-dvh flex-col justify-center gap-6 pt-32 pb-24",
            )}
          >
            {statItems.length > 0 ? (
              <p
                className="landing-enter caption-1 pointer-events-auto inline-flex w-fit items-center gap-2 border border-landing-line bg-landing-bg/70 px-3 py-1 text-landing-muted backdrop-blur-md"
                style={cssVar("--enter-step", 0)}
              >
                <span aria-hidden="true" className="size-2 bg-primary" />
                {statItems
                  .map(([, value, one, many]) => plural(value, one, many))
                  .join(" · ")}
              </p>
            ) : null}
            <h1 className="heading-4 sm:heading-2 lg:heading-1 pointer-events-auto max-w-[680px]">
              {HERO_LINES.map((line, index) => (
                <span key={line} className="landing-line">
                  <span
                    className="landing-hero-heading"
                    style={cssVar("--line", index)}
                  >
                    {line}
                  </span>
                </span>
              ))}
            </h1>
            <p
              className="landing-enter title-2 pointer-events-auto max-w-[560px] text-landing-muted"
              style={cssVar("--enter-step", 4)}
            >
              AllFranchisis gathers the movies, series and animated spinoffs of
              each universe into one curated collection. You always know what
              comes next.
            </p>
            <div
              className="landing-enter pointer-events-none flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:gap-6 [&>*]:pointer-events-auto"
              style={cssVar("--enter-step", 5)}
            >
              <PrimaryCta />
              <p className="caption-2 text-landing-muted">
                No account needed to browse.
              </p>
            </div>
          </div>
        </section>

        {featured && featured.media.length > 0 ? (
          <section className={SECTION} aria-labelledby="order-heading">
            <Reveal className={cn(CONTAINER, "flex flex-col gap-12")}>
              <SectionHeading
                id="order-heading"
                title={
                  <>
                    Sequels, spinoffs, reboots.
                    <br />
                    One list untangles them.
                  </>
                }
              >
                Release dates rarely tell you where to start. Here is how{" "}
                {featured.name} opens, in the order an editor picked for
                watching.
              </SectionHeading>
              <WatchOrder featured={featured} />
            </Reveal>
          </section>
        ) : null}

        <section
          className={cn(
            SECTION,
            "border-landing-line border-y bg-landing-surface",
          )}
          aria-labelledby="benefits-heading"
        >
          <Reveal
            className={cn(
              CONTAINER,
              "grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-16",
            )}
          >
            <SectionHeading id="benefits-heading" title="Know what comes next">
              Everything a franchise needs to be watched in sequence, in one
              place.
            </SectionHeading>
            <ul className="grid gap-x-12 sm:grid-cols-2">
              {BENEFITS.map(({ icon: Icon, title, body }, index) => (
                <li
                  key={title}
                  className="landing-stagger flex flex-col gap-3 border-landing-line border-t py-6"
                  style={stagger(index + 1)}
                >
                  <Icon aria-hidden="true" className="size-5 text-primary" />
                  <h3 className="heading-6 text-landing-fg">{title}</h3>
                  <p className="body-6 text-landing-muted">{body}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        {recent.length > 0 ? (
          <section className={SECTION} aria-labelledby="recent-heading">
            <Reveal className={cn(CONTAINER, "flex flex-col gap-12")}>
              <SectionTop>
                <SectionHeading
                  id="recent-heading"
                  title="Recently added and updated"
                >
                  New universes and fresh entries, straight from the catalog.
                </SectionHeading>
                <ArrowLink href="/collections">See all collections</ArrowLink>
              </SectionTop>
              <CollectionRow collections={recent} />
            </Reveal>
          </section>
        ) : null}

        <section className="py-24" aria-label="What we do">
          <div className={CONTAINER}>
            <TaglineReveal lines={TAGLINE} />
          </div>
        </section>

        <section
          className={cn(
            SECTION,
            "border-landing-line border-y bg-landing-surface",
          )}
          aria-labelledby="steps-heading"
        >
          <Reveal className={cn(CONTAINER, "flex flex-col gap-12")}>
            <SectionHeading
              id="steps-heading"
              title="Three steps to the start"
            />
            <ol className="grid gap-8 md:grid-cols-3 md:gap-6">
              {STEPS.map(({ title, body }, index) => (
                <li
                  key={title}
                  className="landing-stagger flex flex-col gap-4"
                  style={stagger(index * 2)}
                >
                  <div className="flex items-center gap-3" aria-hidden="true">
                    <span className="landing-mono title-4 flex size-10 shrink-0 items-center justify-center border border-landing-line bg-landing-bg text-primary">
                      {pad(index + 1)}
                    </span>
                    <span
                      className="landing-draw h-px flex-1 bg-landing-line max-md:hidden"
                      style={stagger(index * 2 + 1)}
                    />
                  </div>
                  <h3 className="heading-6 text-landing-fg">{title}</h3>
                  <p className="body-6 max-w-sm text-landing-muted">{body}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </section>

        {statItems.length > 0 ? (
          <section className={SECTION} aria-labelledby="library-heading">
            <Reveal className={cn(CONTAINER, "flex flex-col gap-16")}>
              <div className="flex flex-col gap-12">
                <SectionHeading
                  id="library-heading"
                  title="What is inside today"
                >
                  Live counts from the catalog. They grow as new collections are
                  curated.
                </SectionHeading>
                <dl className="grid grid-cols-1 border border-landing-line max-sm:divide-y sm:grid-cols-3 sm:divide-x divide-landing-line">
                  {statItems.map(([label, value], index) => (
                    <div
                      key={label}
                      className="landing-stagger flex flex-col gap-2 p-6"
                      style={stagger(index)}
                    >
                      <dt className="caption-1 text-landing-muted">{label}</dt>
                      <dd className="landing-mono heading-2 text-landing-fg">
                        <CountUp value={value} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {genres.length > 0 ? (
                <div className="flex flex-col gap-4">
                  <h3 className="title-2 text-landing-fg">Browse by genre</h3>
                  <ul className="flex flex-wrap gap-2">
                    {genres.map((genre, index) => (
                      <li
                        key={genre}
                        className="landing-stagger"
                        style={stagger(index)}
                      >
                        <Link
                          href={`/collections?genre=${encodeURIComponent(genre)}`}
                          className={cn(
                            "button-sm inline-block border border-landing-line px-3 py-2 text-landing-fg transition-colors duration-300 hover:border-primary hover:text-primary active:scale-[0.98]",
                            EASE,
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
                  <h3 className="title-2 text-landing-fg">
                    Most favorited by members
                  </h3>
                  <CollectionRow collections={favorites} />
                </div>
              ) : null}
            </Reveal>
          </section>
        ) : null}

        <section
          className={cn(SECTION, "border-landing-line border-t")}
          aria-labelledby="faq-heading"
        >
          <Reveal
            className={cn(
              CONTAINER,
              "grid grid-cols-1 gap-12 lg:grid-cols-[1fr_2fr] lg:gap-16",
            )}
          >
            <SectionHeading id="faq-heading" title="Questions, answered" />
            <div className="flex flex-col divide-y divide-landing-line border-landing-line border-y">
              {FAQ.map(({ q, a }) => (
                <details key={q} className="group">
                  <summary
                    className={cn(
                      "title-2 flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-landing-fg transition-colors duration-300 hover:text-primary [&::-webkit-details-marker]:hidden",
                      EASE,
                      FOCUS,
                    )}
                  >
                    {q}
                    <Plus
                      aria-hidden="true"
                      className={cn(
                        "size-5 shrink-0 text-primary transition-transform duration-500 group-open:rotate-45",
                        EASE,
                      )}
                    />
                  </summary>
                  <p className="body-3 max-w-[680px] pb-6 text-landing-muted">
                    {a}
                  </p>
                </details>
              ))}
            </div>
          </Reveal>
        </section>

        <section className="pb-16 sm:pb-24" aria-labelledby="final-heading">
          <Reveal className={CONTAINER}>
            <div className="relative isolate flex flex-col items-center gap-6 overflow-hidden border border-landing-line bg-landing-surface px-6 py-16 text-center sm:py-24">
              <div className="-z-10 absolute inset-0">
                <PosterWall
                  posters={content?.posters ?? []}
                  variant="backdrop"
                />
              </div>
              <h2
                id="final-heading"
                className="landing-hero-heading heading-3 sm:heading-2 max-w-[680px] pb-1"
              >
                Pick a universe.
                <br />
                Start at the beginning.
              </h2>
              <p className="title-2 max-w-[560px] text-landing-muted">
                {ACCOUNT_LINE}
              </p>
              <PrimaryCta />
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-landing-line border-t">
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
            <TmdbAttribution textClassName="caption-5 text-landing-muted" />
          </div>
          <nav aria-label="Footer" className="-mx-3 flex gap-1">
            <Link
              href="/collections"
              className={cn(
                "button-sm px-3 py-2 text-landing-muted transition-colors duration-300 hover:text-landing-fg",
                EASE,
                FOCUS,
              )}
            >
              Collections
            </Link>
            <Link
              href="/about"
              className={cn(
                "button-sm px-3 py-2 text-landing-muted transition-colors duration-300 hover:text-landing-fg",
                EASE,
                FOCUS,
              )}
            >
              About
            </Link>
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noreferrer"
              className={cn(
                "button-sm px-3 py-2 text-landing-muted transition-colors duration-300 hover:text-landing-fg",
                EASE,
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
