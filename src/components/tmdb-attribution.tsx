import Image from "next/image";
import { cn } from "@/lib/utils";

export function TmdbAttribution({
  className,
  logoClassName = "w-9",
  textClassName = "text-xs leading-snug text-muted-foreground",
}: {
  className?: string;
  logoClassName?: string;
  textClassName?: string;
}) {
  return (
    <div className={cn("flex flex-col items-start gap-2", className)}>
      <a
        href="https://www.themoviedb.org"
        target="_blank"
        rel="noreferrer noopener"
        aria-label="The Movie Database (TMDB)"
      >
        <Image
          src="/tmdb-logo.svg"
          alt="TMDB logo"
          width={512}
          height={369}
          className={cn("h-auto", logoClassName)}
        />
      </a>
      <p className={textClassName}>
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </p>
    </div>
  );
}
