const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export function tmdbImage(path: string | null | undefined, size = "w500") {
  return path ? `${TMDB_IMAGE_BASE_URL}/${size}${path}` : null;
}
