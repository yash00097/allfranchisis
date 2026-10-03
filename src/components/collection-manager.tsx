"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  addMediaToCollection,
  createCollection,
  deleteCollection,
  removeMediaFromCollection,
  reorderCollectionMedia,
  searchCollectionMedia,
  updateCollection,
} from "@/app/dashboard/collections/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { tmdbImage } from "@/lib/tmdb/images";

type ManagerMedia = {
  id: string;
  tmdbId: number;
  mediaType: "MOVIE" | "TV";
  title: string;
  posterPath: string | null;
};

type ManagerCollection = {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImageUrl: string | null;
  backdropUrl: string | null;
  media: ManagerMedia[];
};

type SearchResult = {
  id: number;
  mediaType: "MOVIE" | "TV";
  title: string;
  overview: string;
  posterPath: string | null;
  releaseDate: string;
  voteAverage: number | null;
};

export function CollectionManager({
  collections,
}: {
  collections: ManagerCollection[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedCollection, setSelectedCollection] = useState(
    collections[0]?.id ?? "",
  );
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearching(true);
    setSearchError("");
    try {
      setSearchResults(await searchCollectionMedia(query));
    } catch (error) {
      setSearchError(
        error instanceof Error ? error.message : "TMDB search failed.",
      );
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Create collection</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCollection} className="grid gap-4 md:grid-cols-2">
            <Field label="Name" name="name" required />
            <Field
              label="Slug"
              name="slug"
              placeholder="Optional, generated from name"
            />
            <Field label="Cover image URL or TMDB path" name="coverImageUrl" />
            <Field label="Backdrop image URL or TMDB path" name="backdropUrl" />
            <label className="grid gap-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" required />
            </label>
            <Button type="submit" className="w-fit">
              Create collection
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Find media on TMDB</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search movies or TV shows"
              aria-label="Search TMDB"
            />
            <Button type="submit" disabled={searching}>
              {searching ? "Searching..." : "Search TMDB"}
            </Button>
          </form>
          {searchError ? (
            <p className="text-sm text-destructive">{searchError}</p>
          ) : null}
          {searchResults.map((result) => (
            <div
              key={`${result.mediaType}-${result.id}`}
              className="flex gap-3 border p-3"
            >
              <div className="size-16 shrink-0 overflow-hidden bg-muted">
                {result.posterPath ? (
                  <img
                    src={tmdbImage(result.posterPath, "w185") ?? undefined}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <h3 className="font-semibold">{result.title}</h3>
                  <Badge variant="outline">
                    {result.mediaType === "MOVIE" ? "Movie" : "TV"}
                  </Badge>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {result.overview || "No overview available."}
                </p>
                <p className="text-xs text-muted-foreground">
                  {result.releaseDate || "Date unavailable"} · TMDB{" "}
                  {result.voteAverage?.toFixed(1) ?? "N/A"}
                </p>
              </div>
              <form action={addMediaToCollection} className="self-center">
                <input
                  type="hidden"
                  name="collectionId"
                  value={selectedCollection}
                />
                <input type="hidden" name="tmdbId" value={result.id} />
                <input
                  type="hidden"
                  name="mediaType"
                  value={result.mediaType}
                />
                <Button type="submit" size="sm" disabled={!selectedCollection}>
                  Add
                </Button>
              </form>
            </div>
          ))}
          {collections.length ? (
            <label className="grid max-w-md gap-2">
              <Label htmlFor="targetCollection">Add results to</Label>
              <select
                id="targetCollection"
                value={selectedCollection}
                onChange={(event) => setSelectedCollection(event.target.value)}
                className="h-8 border border-input bg-background px-2 text-sm"
              >
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="text-sm text-muted-foreground">
              Create a collection before adding media.
            </p>
          )}
        </CardContent>
      </Card>

      {collections.map((collection) => (
        <ManagedCollection
          key={collection.id}
          collection={collection}
          routerRefresh={() => router.refresh()}
        />
      ))}
      {!collections.length ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No collections yet</EmptyTitle>
            <EmptyDescription>
              Create your first collection above.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}
    </div>
  );
}

function ManagedCollection({
  collection,
  routerRefresh,
}: {
  collection: ManagerCollection;
  routerRefresh: () => void;
}) {
  const [media, setMedia] = useState(collection.media);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{collection.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <form action={updateCollection} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="id" value={collection.id} />
          <Field
            label="Name"
            name="name"
            defaultValue={collection.name}
            required
          />
          <Field
            label="Slug"
            name="slug"
            defaultValue={collection.slug}
            required
          />
          <Field
            label="Cover image"
            name="coverImageUrl"
            defaultValue={collection.coverImageUrl ?? ""}
          />
          <Field
            label="Backdrop image"
            name="backdropUrl"
            defaultValue={collection.backdropUrl ?? ""}
          />
          <label className="grid gap-2 md:col-span-2">
            <Label htmlFor={`description-${collection.id}`}>Description</Label>
            <Textarea
              id={`description-${collection.id}`}
              name="description"
              defaultValue={collection.description}
              required
            />
          </label>
          <Button type="submit" className="w-fit">
            Save changes
          </Button>
        </form>
        <div className="flex flex-col gap-2 border-t pt-4">
          <h3 className="font-semibold">Media order</h3>
          {media.map((item, index) => (
            <div key={item.id} className="flex items-center gap-3 border p-2">
              <div className="size-10 shrink-0 overflow-hidden bg-muted">
                {item.posterPath ? (
                  <img
                    src={tmdbImage(item.posterPath, "w92") ?? undefined}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <span className="min-w-0 flex-1 truncate">{item.title}</span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={index === 0}
                onClick={() => setMedia(move(media, index, -1))}
                title="Move up"
              >
                ↑
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={index === media.length - 1}
                onClick={() => setMedia(move(media, index, 1))}
                title="Move down"
              >
                ↓
              </Button>
              <form action={removeMediaFromCollection}>
                <input
                  type="hidden"
                  name="collectionId"
                  value={collection.id}
                />
                <input type="hidden" name="mediaItemId" value={item.id} />
                <Button type="submit" size="sm" variant="destructive">
                  Remove
                </Button>
              </form>
            </div>
          ))}
          {media.length ? (
            <form action={reorderCollectionMedia} onSubmit={routerRefresh}>
              <input type="hidden" name="collectionId" value={collection.id} />
              <input
                type="hidden"
                name="mediaItemIds"
                value={JSON.stringify(media.map((item) => item.id))}
              />
              <Button type="submit" variant="outline" className="mt-2 w-fit">
                Save media order
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">No media assigned.</p>
          )}
        </div>
        <form
          action={deleteCollection}
          onSubmit={(event) => {
            if (!window.confirm(`Delete ${collection.name}?`))
              event.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={collection.id} />
          <Button type="submit" variant="destructive">
            Delete collection
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <Label htmlFor={`${name}-${defaultValue ?? "new"}`}>{label}</Label>
      <Input
        id={`${name}-${defaultValue ?? "new"}`}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}

function move<T>(items: T[], index: number, offset: number) {
  const next = [...items];
  const target = index + offset;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
