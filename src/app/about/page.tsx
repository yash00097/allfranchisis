import type { Metadata } from "next";
import { PAGE_MAIN_CLASS, PageHeader } from "@/components/page-header";
import { TmdbAttribution } from "@/components/tmdb-attribution";

export const metadata: Metadata = {
  title: "About & Credits · AllFranchisis",
  description:
    "What AllFranchisis is, and where its movie and TV data comes from.",
};

export default function AboutPage() {
  return (
    <main className={`${PAGE_MAIN_CLASS} max-w-3xl`}>
      <PageHeader
        kicker="AllFranchisis"
        title="About & Credits"
        description="Every movie, show and spin-off of a franchise, in one place and in the right order."
      />
      <section aria-labelledby="about-data" className="flex flex-col gap-4">
        <h2 id="about-data" className="font-heading text-2xl font-medium">
          Data and images
        </h2>
        <p className="text-muted-foreground">
          Titles, posters, backdrops, release dates and ratings come from TMDB.
          The ratings you see are TMDB scores, not AllFranchisis reviews.
        </p>
        <TmdbAttribution
          className="gap-4 border-t border-border pt-6"
          logoClassName="w-24"
          textClassName="text-sm text-foreground"
        />
      </section>
    </main>
  );
}
