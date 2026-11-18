const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export function tmdbImage(path: string | null | undefined, size = "w500") {
  return path ? `${TMDB_IMAGE_BASE_URL}/${size}${path}` : null;
}

// Absolute URLs come from non-TMDB hosts that have no size variants.
export function tmdbSrcSet(
  path: string | null | undefined,
  widths: readonly number[],
) {
  if (!path || path.startsWith("http")) return undefined;
  return widths.map((w) => `${tmdbImage(path, `w${w}`)} ${w}w`).join(", ");
}
