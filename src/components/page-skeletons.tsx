import { PAGE_MAIN_CLASS } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";

const range = (count: number) => Array.from({ length: count }, (_, i) => i);

function LoadingStatus() {
  return (
    <span role="status" className="sr-only">
      Loading…
    </span>
  );
}

function PosterSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-2/3 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

/** Mirrors CollectionGrid / the franchise grid: sm:3 / lg:4, 70% width on phones. */
export function CardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid items-start gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {range(count).map((i) => (
        <div key={i} className="mx-auto w-[70%] sm:w-full">
          <PosterSkeleton />
        </div>
      ))}
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-64 sm:h-12" />
      <Skeleton className="h-4 w-full max-w-md" />
    </div>
  );
}

/** PageHeader + search + card grid: library pages and /franchises. */
export function ListPageSkeleton({ search = true }: { search?: boolean }) {
  return (
    <main className={PAGE_MAIN_CLASS} aria-busy="true">
      <LoadingStatus />
      <HeaderSkeleton />
      {search ? <Skeleton className="h-10 w-full max-w-md" /> : null}
      <CardGridSkeleton />
    </main>
  );
}

/** /collections: header, genre chip row, search, discovery rows. */
export function CollectionsPageSkeleton() {
  return (
    <main className={PAGE_MAIN_CLASS} aria-busy="true">
      <LoadingStatus />
      <HeaderSkeleton />
      <div className="flex gap-2 overflow-hidden">
        {range(8).map((i) => (
          <Skeleton key={i} className="h-8 w-24 shrink-0" />
        ))}
      </div>
      <Skeleton className="h-10 w-full max-w-md" />
      {range(2).map((i) => (
        <section key={i} className="flex flex-col gap-4">
          <Skeleton className="h-6 w-48" />
          <CardGridSkeleton count={4} />
        </section>
      ))}
    </main>
  );
}

type HeroBody = "media-grid" | "card-grid" | "text";

/** Backdrop hero with cover + title, then the page body. */
export function HeroPageSkeleton({ body }: { body: HeroBody }) {
  return (
    <main className="flex flex-1 flex-col" aria-busy="true">
      <LoadingStatus />
      <section className="border-b border-foreground/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:flex-row lg:items-end lg:py-16">
          <Skeleton className="aspect-2/3 w-40 lg:w-48" />
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <Skeleton className="h-4 w-28" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-10 w-3/4 max-w-xl lg:h-14" />
            </div>
            <div className="flex max-w-3xl flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <Skeleton className="h-11 w-64" />
          </div>
        </div>
      </section>
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-10">
        {body === "media-grid" ? (
          <>
            <div className="flex flex-wrap gap-2">
              {range(5).map((i) => (
                <Skeleton key={i} className="h-9 w-28" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4 xl:grid-cols-5">
              {range(10).map((i) => (
                <PosterSkeleton key={i} />
              ))}
            </div>
          </>
        ) : null}
        {body === "card-grid" ? <CardGridSkeleton /> : null}
        {body === "text" ? (
          <div className="flex max-w-3xl flex-col gap-3">
            {range(4).map((i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
