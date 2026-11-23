import { SignInButton } from "@clerk/nextjs";
import { cn } from "cn";
import { setCollectionStatus } from "@/features/library/actions";
import { buttonVariants } from "@/components/ui/button";
import {
  WATCH_STATUSES,
  WATCH_STATUS_LABELS,
  type WatchStatus,
} from "@/features/library/watch-status/types";

type CollectionStatusControlProps = {
  slug: string;
  status: WatchStatus | null;
  isSignedIn: boolean;
};

export function CollectionStatusControl({
  slug,
  status,
  isSignedIn,
}: CollectionStatusControlProps) {
  if (!isSignedIn) {
    return (
      <p className="flex h-11 items-center gap-1 text-sm text-muted-foreground">
        <SignInButton mode="modal">
          <button
            type="button"
            className="text-foreground underline underline-offset-4 transition-colors hover:text-primary"
          >
            Sign in
          </button>
        </SignInButton>{" "}
        to track this collection
      </p>
    );
  }

  return (
    <form
      action={setCollectionStatus}
      aria-label="Watch status"
      className="flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="slug" value={slug} />
      {WATCH_STATUSES.map((value) => (
        <button
          key={value}
          type="submit"
          name="status"
          value={value}
          aria-pressed={status === value}
          className={cn(
            buttonVariants({
              variant: status === value ? "default" : "outline",
              size: "lg",
            }),
            "h-11 px-4",
          )}
        >
          {WATCH_STATUS_LABELS[value]}
        </button>
      ))}
      {status ? (
        <button
          type="submit"
          name="status"
          value="NONE"
          className={cn(
            buttonVariants({ variant: "ghost", size: "lg" }),
            "h-11 px-4 text-muted-foreground",
          )}
        >
          Remove
        </button>
      ) : null}
    </form>
  );
}
