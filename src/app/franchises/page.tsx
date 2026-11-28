import { Layers } from "lucide-react";
import { imagePriorityFor } from "@/features/collections/components/collection-card";
import { Badge } from "@/components/ui/badge";
import { FranchiseCard } from "@/features/franchises/components/franchise-card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { listFranchises } from "@/features/franchises/queries";

export const dynamic = "force-dynamic";

export default async function FranchisesPage() {
  const franchises = await listFranchises();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Explore
        </p>
        <h1 className="flex items-center gap-3 font-heading text-4xl font-bold tracking-tight">
          Franchises
          <Badge variant="outline">Beta</Badge>
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Universes that bring related collections together. Franchises are in
          beta; collections are the main way to browse for now.
        </p>
      </header>
      {franchises.length ? (
        <div className="grid items-start gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {franchises.map((franchise, index) => (
            <div key={franchise.slug} className="mx-auto w-[70%] sm:w-full">
              <FranchiseCard
                franchise={franchise}
                imagePriority={imagePriorityFor(index)}
              />
            </div>
          ))}
        </div>
      ) : (
        <Empty className="min-h-80 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Layers />
            </EmptyMedia>
            <EmptyTitle>No franchises yet</EmptyTitle>
            <EmptyDescription>
              Franchises will appear here once they are created.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </main>
  );
}
