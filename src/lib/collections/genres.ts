export const COLLECTION_GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Music",
  "Mystery",
  "Romance",
  "Science Fiction",
  "TV Movie",
  "Thriller",
  "War",
  "Western",
] as const;

export type CollectionGenre = (typeof COLLECTION_GENRES)[number];

export function sanitizeCollectionGenres(values: string[]): CollectionGenre[] {
  const submitted = new Set(values);
  return COLLECTION_GENRES.filter((genre) => submitted.has(genre));
}

export function isCollectionGenre(value: unknown): value is CollectionGenre {
  return (
    typeof value === "string" &&
    (COLLECTION_GENRES as readonly string[]).includes(value)
  );
}
