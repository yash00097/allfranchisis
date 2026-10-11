import { cn } from "cn";
import { Badge } from "@/components/ui/badge";

export function GenreBadges({
  genres,
  className,
}: {
  genres?: string[] | null;
  className?: string;
}) {
  if (!genres?.length) return null;
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {genres.map((genre) => (
        <Badge key={genre} variant="secondary">
          {genre}
        </Badge>
      ))}
    </div>
  );
}
