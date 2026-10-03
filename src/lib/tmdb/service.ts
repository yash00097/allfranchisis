import "server-only";

import type {
  TmdbMovie,
  TmdbSeason,
  TmdbSearchResponse,
  TmdbTv,
} from "./types";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const REQUEST_TIMEOUT_MS = 8_000;

function getCredential() {
  const bearerToken = process.env.TMDB_API_Read_Access_Token?.trim();
  const apiKey = process.env.TMDB_API_Key?.trim();

  if (!bearerToken && !apiKey) {
    throw new Error("TMDB credentials are not configured on the server.");
  }

  return { bearerToken, apiKey };
}

function validateId(value: number) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("TMDB ID must be a positive integer.");
  }
}

function validateQuery(query: string) {
  const normalized = query.trim();
  if (normalized.length < 2 || normalized.length > 100) {
    throw new Error("TMDB search queries must contain 2 to 100 characters.");
  }
  return normalized;
}

function validatePage(page: number) {
  return Number.isInteger(page) && page >= 1 && page <= 500 ? page : 1;
}

async function tmdbFetch<T>(path: string, params?: URLSearchParams) {
  const { bearerToken, apiKey } = getCredential();
  const url = new URL(`${TMDB_BASE_URL}${path}`);

  if (params) {
    url.search = params.toString();
  }
  if (!bearerToken && apiKey) {
    url.searchParams.set("api_key", apiKey);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: bearerToken
        ? { Authorization: `Bearer ${bearerToken}` }
        : undefined,
      next: { revalidate: 3600 },
      signal: controller.signal,
    });

    if (response.status === 429) {
      throw new Error("TMDB rate limit reached. Please try again shortly.");
    }
    if (!response.ok) {
      throw new Error(`TMDB request failed with status ${response.status}.`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("TMDB request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function searchTmdb(query: string, page = 1) {
  const params = new URLSearchParams({
    query: validateQuery(query),
    page: String(validatePage(page)),
    include_adult: "false",
  });
  return tmdbFetch<TmdbSearchResponse>("/search/multi", params);
}

export function getMovieDetails(tmdbId: number) {
  validateId(tmdbId);
  return tmdbFetch<TmdbMovie>(`/movie/${tmdbId}`);
}

export function getTvDetails(tmdbId: number) {
  validateId(tmdbId);
  return tmdbFetch<TmdbTv>(`/tv/${tmdbId}`);
}

export function getTvSeasonDetails(tmdbId: number, seasonNumber: number) {
  validateId(tmdbId);
  if (
    !Number.isInteger(seasonNumber) ||
    seasonNumber < 0 ||
    seasonNumber > 200
  ) {
    throw new Error("TV season number is invalid.");
  }
  return tmdbFetch<TmdbSeason>(`/tv/${tmdbId}/season/${seasonNumber}`);
}
