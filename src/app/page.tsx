import { ArrowRight, Library } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 items-center px-6 py-20">
      <section className="flex max-w-3xl flex-col gap-6">
        <div className="flex size-12 items-center justify-center bg-primary text-primary-foreground">
          <Library />
        </div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          AllFranchisis
        </p>
        <h1 className="font-heading text-5xl font-bold tracking-tight sm:text-7xl">
          Find the stories that belong together.
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Explore curated collections of movies, television, and animation
          across the worlds you love.
        </p>
        <Link href="/collections" className={`${buttonVariants()} w-fit`}>
          Explore collections <ArrowRight />
        </Link>
      </section>
    </main>
  );
}
