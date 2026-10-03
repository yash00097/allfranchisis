import { Library } from "lucide-react";
import { CollectionBrowser } from "@/components/collection-browser";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { listCollections } from "@/lib/collections";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const collections = await listCollections();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Explore
        </p>
        <h1 className="font-heading text-4xl font-bold tracking-tight">
          Collections
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Browse curated worlds across movies, television, and animation.
        </p>
      </header>
      {collections.length ? (
        <CollectionBrowser collections={collections} />
      ) : (
        <Empty className="min-h-80 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Library />
            </EmptyMedia>
            <EmptyTitle>No collections yet</EmptyTitle>
            <EmptyDescription>
              Curated collections will appear here when they are published.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </main>
  );
}
