import { SignInButton } from "@clerk/nextjs";
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
      <p className="text-sm text-muted-foreground">
        <SignInButton mode="modal">
          <button type="button" className="underline">
            Sign in
          </button>
        </SignInButton>{" "}
        to track this collection.
      </p>
    );
  }

  return (
    <form
      action={setCollectionStatus}
      className="flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="slug" value={slug} />
      <span className="text-sm text-muted-foreground">Your status:</span>
      {WATCH_STATUSES.map((value) => (
        <button
          key={value}
          type="submit"
          name="status"
          value={value}
          aria-pressed={status === value}
          className={buttonVariants({
            variant: status === value ? "default" : "outline",
            size: "sm",
          })}
        >
          {WATCH_STATUS_LABELS[value]}
        </button>
      ))}
      {status ? (
        <button
          type="submit"
          name="status"
          value="NONE"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          Remove
        </button>
      ) : null}
    </form>
  );
}
