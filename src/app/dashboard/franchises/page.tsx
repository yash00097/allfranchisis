import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { FranchiseManager } from "@/features/franchises/components/franchise-manager";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { isCollectionManager } from "@/lib/auth/collection-manager";
import { listCollections } from "@/features/collections";
import { listFranchisesForManager } from "@/features/franchises/queries";

export const dynamic = "force-dynamic";

export default async function ManageFranchisesPage() {
  await auth.protect();

  if (!(await isCollectionManager())) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-5 px-6 py-16 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Owner workspace
        </p>
        <h1 className="font-heading text-3xl font-bold">
          Franchise management is owner-only
        </h1>
        <p className="text-muted-foreground">
          This area is reserved for the collection owner. You can still browse
          all published franchises.
        </p>
        <Link href="/franchises" className={buttonVariants()}>
          Browse franchises
        </Link>
      </main>
    );
  }

  const [franchises, collections] = await Promise.all([
    listFranchisesForManager(),
    listCollections(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Manager workspace
        </p>
        <h1 className="flex items-center gap-3 font-heading text-4xl font-bold tracking-tight">
          Manage franchises
          <Badge variant="outline">Beta</Badge>
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Group collections into franchises and set their order.
        </p>
      </header>
      <FranchiseManager
        franchises={franchises.map(({ collections, ...franchise }) => ({
          id: franchise.id,
          name: franchise.name,
          slug: franchise.slug,
          description: franchise.description,
          coverImageUrl: franchise.coverImageUrl,
          backdropUrl: franchise.backdropUrl,
          collections: collections.map(({ collection }) => collection),
        }))}
        collections={collections.map(({ id, name }) => ({ id, name }))}
      />
    </main>
  );
}
