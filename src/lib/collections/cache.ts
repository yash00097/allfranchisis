import "server-only";

import { revalidateTag } from "next/cache";

export const COLLECTIONS_TAG = "collections";
export const DISCOVERY_TAG = "collection-discovery";

const DATE_KEYS = new Set(["createdAt", "updatedAt", "releaseDate", "addedAt"]);

// Every cached collection read carries COLLECTIONS_TAG, so one call covers all slugs.
export function invalidateCollections() {
  revalidateTag(COLLECTIONS_TAG, { expire: 0 });
}

// unstable_cache round-trips through JSON, which turns Date fields into strings.
export function reviveDates<T>(value: T): T {
  if (Array.isArray(value)) return value.map(reviveDates) as T;
  if (value === null || typeof value !== "object" || value instanceof Date) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      DATE_KEYS.has(key) && typeof entry === "string"
        ? new Date(entry)
        : reviveDates(entry),
    ]),
  ) as T;
}
