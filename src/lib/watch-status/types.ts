export const WATCH_STATUSES = ["WATCHING", "WATCHED"] as const;

export type WatchStatus = (typeof WATCH_STATUSES)[number];

export function isWatchStatus(value: string): value is WatchStatus {
  return (WATCH_STATUSES as readonly string[]).includes(value);
}

export const WATCH_STATUS_LABELS: Record<WatchStatus, string> = {
  WATCHING: "Watching",
  WATCHED: "Watched",
};
