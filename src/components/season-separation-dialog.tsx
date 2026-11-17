"use client";

import { RefreshCw, Scissors, Split } from "lucide-react";
import { useState, useTransition } from "react";
import {
  refreshTvSeasonSeparation,
  saveSeasonSeparation,
} from "@/app/dashboard/collections/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type SeasonGroup = {
  id: string | null;
  groupOrder: number;
  displayOrder: number;
  seasonNumbers: number[];
};

function label(seasonNumber: number) {
  return seasonNumber === 0 ? "Specials" : `Season ${seasonNumber}`;
}

function normalizeGroups(groups: SeasonGroup[], seasons: number[]) {
  if (groups.length) {
    return groups.map((group) => [...group.seasonNumbers]);
  }
  return seasons.length ? [seasons] : [];
}

export function SeasonSeparationDialog({
  collectionId,
  mediaItemId,
  title,
  seasonCount,
  seasonGroups,
  onChanged,
}: {
  collectionId: string;
  mediaItemId: string;
  title: string;
  seasonCount: number | null;
  seasonGroups: SeasonGroup[];
  onChanged: () => void;
}) {
  const seasons = Array.from(
    { length: seasonCount ?? 0 },
    (_, index) => index + 1,
  );
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState(() =>
    normalizeGroups(seasonGroups, seasons),
  );
  const [error, setError] = useState("");
  const [isSaving, startSaving] = useTransition();
  const [isRefreshing, startRefreshing] = useTransition();

  function openEditor(nextOpen: boolean) {
    if (nextOpen) {
      setGroups(normalizeGroups(seasonGroups, seasons));
      setError("");
    }
    setOpen(nextOpen);
  }

  function split(groupIndex: number, seasonIndex: number) {
    setGroups((current) => {
      const group = current[groupIndex];
      if (!group || seasonIndex === 0 || seasonIndex >= group.length) {
        return current;
      }
      return [
        ...current.slice(0, groupIndex),
        group.slice(0, seasonIndex),
        group.slice(seasonIndex),
        ...current.slice(groupIndex + 1),
      ];
    });
  }

  function merge(groupIndex: number) {
    if (groupIndex === 0) return;
    setGroups((current) => {
      const previous = current[groupIndex - 1] ?? [];
      const group = current[groupIndex] ?? [];
      return [
        ...current.slice(0, groupIndex - 1),
        [...previous, ...group],
        ...current.slice(groupIndex + 1),
      ];
    });
  }

  function save() {
    const formData = new FormData();
    formData.set("collectionId", collectionId);
    formData.set("mediaItemId", mediaItemId);
    formData.set(
      "groups",
      JSON.stringify(
        groups.map((seasonNumbers) => ({ seasons: seasonNumbers })),
      ),
    );
    setError("");
    startSaving(async () => {
      try {
        await saveSeasonSeparation(formData);
        setOpen(false);
        onChanged();
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Could not save season separation.",
        );
      }
    });
  }

  function refresh() {
    const formData = new FormData();
    formData.set("collectionId", collectionId);
    formData.set("mediaItemId", mediaItemId);
    setError("");
    startRefreshing(async () => {
      try {
        const result = await refreshTvSeasonSeparation(formData);
        setGroups(result.groups.map((group) => [...group.seasonNumbers]));
        onChanged();
      } catch (refreshError) {
        setError(
          refreshError instanceof Error
            ? refreshError.message
            : "Could not refresh seasons from TMDB.",
        );
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={openEditor}>
      <DialogTrigger
        render={
          <Button
            type="button"
            size="icon-sm"
            variant={seasonGroups.length ? "secondary" : "ghost"}
            title={`Configure seasons for ${title}`}
            aria-label={`Configure seasons for ${title}`}
          />
        }
      >
        <Scissors />
      </DialogTrigger>
      <DialogContent className="max-h-[min(90vh,42rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Separate seasons for {title}</DialogTitle>
          <DialogDescription>
            Split the chronological season list into groups. Groups remain
            linked to the original TMDB show.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {groups.map((group, groupIndex) => (
            <div
              key={`${group.join("-")}-${groupIndex}`}
              className="border p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <strong className="text-sm">
                  Group {groupIndex + 1}:{" "}
                  {group.length === 1
                    ? label(group[0])
                    : `Seasons ${group[0]}-${group[group.length - 1]}`}
                </strong>
                {groupIndex > 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => merge(groupIndex)}
                  >
                    Merge with previous
                  </Button>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {group.map((season, seasonIndex) => (
                  <span key={season} className="flex items-center gap-1">
                    <span className="border px-2 py-1 text-xs">
                      {label(season)}
                    </span>
                    {seasonIndex > 0 ? (
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        title={`Split before ${label(season)}`}
                        aria-label={`Split before ${label(season)}`}
                        onClick={() => split(groupIndex, seasonIndex)}
                      >
                        <Split />
                      </Button>
                    ) : null}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {!groups.length ? (
            <p className="text-sm text-muted-foreground">
              No seasons are available from the cached TMDB metadata. Refresh
              this title to load its seasons.
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="w-fit"
            disabled={isRefreshing}
            onClick={refresh}
          >
            <RefreshCw className={isRefreshing ? "animate-spin" : undefined} />
            {isRefreshing ? "Refreshing..." : "Refresh seasons from TMDB"}
          </Button>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            type="button"
            disabled={isSaving || !groups.length}
            onClick={save}
          >
            {isSaving ? "Saving..." : "Save separation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
