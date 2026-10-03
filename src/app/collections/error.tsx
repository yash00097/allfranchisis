"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CollectionsError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-5 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center bg-destructive/15 text-destructive">
        <AlertTriangle />
      </div>
      <h1 className="font-heading text-3xl font-bold">Collections are temporarily unavailable</h1>
      <p className="text-muted-foreground">
        The collections database is not ready yet. Apply the pending Prisma migration, then retry this page.
      </p>
      <Button type="button" onClick={reset}>
        <RefreshCw /> Retry
      </Button>
    </main>
  );
}
