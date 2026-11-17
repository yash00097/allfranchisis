export type TmdbMediaType = "movie" | "tv";

export type TmdbListResult = {
  id: number;
  media_type?: TmdbMediaType;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
};

export type TmdbSearchResponse = {
  page: number;
  total_pages: number;
  total_results: number;
  results: TmdbListResult[];
};

export type TmdbGenre = {
  id: number;
  name: string;
};

export type TmdbMovie = TmdbListResult & {
  title: string;
  genres?: TmdbGenre[];
  runtime?: number | null;
};

export type TmdbTv = TmdbListResult & {
  name: string;
  genres?: TmdbGenre[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: TmdbSeasonSummary[];
};

export type TmdbSeasonSummary = {
  id: number;
  season_number: number;
  name?: string;
  air_date?: string | null;
  episode_count?: number;
  poster_path?: string | null;
};

export type TmdbEpisode = {
  id: number;
  episode_number: number;
  name?: string;
  overview?: string;
  air_date?: string;
  still_path?: string | null;
  vote_average?: number;
  vote_count?: number;
};

export type TmdbSeason = {
  id: number;
  season_number: number;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  episodes?: TmdbEpisode[];
};
