"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addCollectionToFranchise,
  createFranchise,
  deleteFranchise,
  type FranchiseActionResult,
  removeCollectionFromFranchise,
  reorderFranchiseCollections,
  updateFranchise,
} from "@/features/franchises/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ManagerCollection = { id: string; name: string; slug: string };

type ManagerFranchise = {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImageUrl: string | null;
  backdropUrl: string | null;
  collections: ManagerCollection[];
};

type Action = (formData: FormData) => Promise<FranchiseActionResult>;

function useFranchiseAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function run(action: Action, formData: FormData, onSuccess?: () => void) {
    setError("");
    startTransition(async () => {
      try {
        const result = await action(formData);
        if (result.error) {
          setError(result.error);
          return;
        }
        onSuccess?.();
        router.refresh();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  return { pending, error, run };
}

export function FranchiseManager({
  franchises,
  collections,
}: {
  franchises: ManagerFranchise[];
  collections: { id: string; name: string }[];
}) {
  return (
    <div className="flex flex-col gap-8">
      <CreateFranchiseCard />
      {franchises.length ? (
        franchises.map((franchise) => (
          <ManagedFranchise
            key={`${franchise.id}:${franchise.collections.map((c) => c.id).join(",")}`}
            franchise={franchise}
            allCollections={collections}
          />
        ))
      ) : (
        <p className="text-sm text-muted-foreground">
          No franchises yet. Create one above.
        </p>
      )}
    </div>
  );
}

function CreateFranchiseCard() {
  const { pending, error, run } = useFranchiseAction();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    run(createFranchise, new FormData(form), () => form.reset());
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create franchise</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <FranchiseFields idPrefix="new" />
          <div className="flex flex-col gap-2 md:col-span-2">
            <Button type="submit" className="w-fit" disabled={pending}>
              {pending ? "Creating..." : "Create franchise"}
            </Button>
            <ErrorMessage error={error} />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ManagedFranchise({
  franchise,
  allCollections,
}: {
  franchise: ManagerFranchise;
  allCollections: { id: string; name: string }[];
}) {
  const { pending, error, run } = useFranchiseAction();
  const [order, setOrder] = useState(franchise.collections);
  const orderChanged = order.some(
    (collection, index) => collection.id !== franchise.collections[index]?.id,
  );
  const memberIds = new Set(franchise.collections.map((c) => c.id));
  const available = allCollections.filter((c) => !memberIds.has(c.id));

  function submitWith(action: Action, fields: Record<string, string>) {
    const formData = new FormData();
    formData.set("franchiseId", franchise.id);
    for (const [key, value] of Object.entries(fields)) formData.set(key, value);
    run(action, formData);
  }

  function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    run(updateFranchise, new FormData(event.currentTarget));
  }

  function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    run(addCollectionToFranchise, new FormData(event.currentTarget));
  }

  function handleDelete() {
    if (!window.confirm("Delete this franchise? Its collections are kept.")) {
      return;
    }
    const formData = new FormData();
    formData.set("id", franchise.id);
    run(deleteFranchise, formData);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-3">
          {franchise.name}
          <Badge variant="secondary">
            {franchise.collections.length}{" "}
            {franchise.collections.length === 1 ? "collection" : "collections"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <form onSubmit={handleUpdate} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="id" value={franchise.id} />
          <FranchiseFields idPrefix={franchise.id} franchise={franchise} />
          <Button
            type="submit"
            variant="outline"
            className="w-fit"
            disabled={pending}
          >
            Save franchise
          </Button>
        </form>

        <section className="flex flex-col gap-3">
          <h3 className="font-heading text-lg font-semibold">Collections</h3>
          {order.length ? (
            <ol className="flex flex-col gap-2">
              {order.map((collection, index) => (
                <li
                  key={collection.id}
                  className="flex items-center gap-3 border p-2"
                >
                  <span className="w-6 text-right text-sm text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {collection.name}
                  </span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Move ${collection.name} up`}
                    disabled={pending || index === 0}
                    onClick={() => setOrder(move(order, index, -1))}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Move ${collection.name} down`}
                    disabled={pending || index === order.length - 1}
                    onClick={() => setOrder(move(order, index, 1))}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() =>
                      submitWith(removeCollectionFromFranchise, {
                        collectionId: collection.id,
                      })
                    }
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">
              No collections in this franchise yet.
            </p>
          )}
          {order.length > 1 ? (
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              disabled={!orderChanged || pending}
              onClick={() =>
                submitWith(reorderFranchiseCollections, {
                  collectionIds: JSON.stringify(order.map((c) => c.id)),
                })
              }
            >
              Save collection order
            </Button>
          ) : null}
          {available.length ? (
            <form
              onSubmit={handleAdd}
              className="flex flex-col gap-2 sm:flex-row sm:items-end"
            >
              <input type="hidden" name="franchiseId" value={franchise.id} />
              <label className="grid gap-2">
                <Label htmlFor={`add-${franchise.id}`}>Add collection</Label>
                <select
                  id={`add-${franchise.id}`}
                  name="collectionId"
                  className="h-8 border border-input bg-background px-2 text-sm"
                >
                  {available.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                    </option>
                  ))}
                </select>
              </label>
              <Button type="submit" className="w-fit" disabled={pending}>
                Add collection
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              All collections are in this franchise.
            </p>
          )}
        </section>

        <ErrorMessage error={error} />

        <Button
          type="button"
          variant="destructive"
          className="w-fit"
          disabled={pending}
          onClick={handleDelete}
        >
          <Trash2 />
          Delete franchise
        </Button>
      </CardContent>
    </Card>
  );
}

function FranchiseFields({
  idPrefix,
  franchise,
}: {
  idPrefix: string;
  franchise?: ManagerFranchise;
}) {
  return (
    <>
      <Field
        id={`${idPrefix}-name`}
        label="Name"
        name="name"
        defaultValue={franchise?.name}
        required
      />
      <Field
        id={`${idPrefix}-slug`}
        label="Slug"
        name="slug"
        defaultValue={franchise?.slug}
        placeholder="Optional, generated from name"
      />
      <Field
        id={`${idPrefix}-cover`}
        label="Cover image URL or TMDB path"
        name="coverImageUrl"
        defaultValue={franchise?.coverImageUrl ?? ""}
      />
      <Field
        id={`${idPrefix}-backdrop`}
        label="Backdrop image URL or TMDB path"
        name="backdropUrl"
        defaultValue={franchise?.backdropUrl ?? ""}
      />
      <label className="grid gap-2 md:col-span-2">
        <Label htmlFor={`${idPrefix}-description`}>Description</Label>
        <Textarea
          id={`${idPrefix}-description`}
          name="description"
          defaultValue={franchise?.description}
          required
        />
      </label>
    </>
  );
}

function Field({
  id,
  label,
  ...inputProps
}: {
  id: string;
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...inputProps} />
    </label>
  );
}

function ErrorMessage({ error }: { error: string }) {
  return error ? (
    <p className="text-sm text-destructive" role="alert">
      {error}
    </p>
  ) : null;
}

function move<T>(items: T[], index: number, offset: number) {
  const next = [...items];
  const target = index + offset;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
