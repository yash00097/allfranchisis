import "server-only";

import type { CollectionMediaSeasonGroup } from "@/generated/prisma/client";
import { getTvDetails } from "@/lib/tmdb";
import type { TmdbTv } from "@/lib/tmdb/types";

export type SeasonGroupView = {
  id: string | null;
  groupOrder: number;
  displayOrder: number;
  seasonNumbers: number[];
};

export function availableSeasonNumbers(tv: TmdbTv) {
  const numbers = tv.seasons?.map((season) => season.season_number) ?? [];
  if (!numbers.length && tv.number_of_seasons) {
    numbers.push(
      ...Array.from({ length: tv.number_of_seasons }, (_, index) => index + 1),
    );
  }
  return [...new Set(numbers)]
    .filter((number) => Number.isInteger(number) && number >= 0)
    .sort((left, right) => left - right);
}

export function seasonLabel(seasonNumbers: number[]) {
  if (!seasonNumbers.length) return "No seasons";
  const labels = seasonNumbers.map((number) =>
    number === 0 ? "Specials" : `Season ${number}`,
  );
  if (seasonNumbers.length === 1) return labels[0];
  if (
    seasonNumbers.every(
      (number, index) => index === 0 || number === seasonNumbers[index - 1] + 1,
    )
  ) {
    const first = seasonNumbers[0] === 0 ? "Specials" : `S${seasonNumbers[0]}`;
    const last = `S${seasonNumbers[seasonNumbers.length - 1]}`;
    return `${first}-${last}`;
  }
  return labels.join(", ");
}

export function defaultSeasonGroups(
  seasonNumbers: number[],
  displayOrder: number,
): SeasonGroupView[] {
  return [
    {
      id: null,
      groupOrder: 0,
      displayOrder,
      seasonNumbers: [...seasonNumbers],
    },
  ];
}

export function validateSeasonGroups(
  groups: Array<{ seasons: number[] }>,
  available: number[],
) {
  if (!groups.length) throw new Error("At least one season group is required.");
  const expected = new Set(available);
  const seen = new Set<number>();
  const normalized = groups.map((group) => {
    const seasons = [...new Set(group.seasons)].sort(
      (left, right) => left - right,
    );
    if (!seasons.length) throw new Error("Season groups cannot be empty.");
    for (const season of seasons) {
      if (!expected.has(season) || seen.has(season)) {
        throw new Error(
          "Season groups must contain each TMDB season exactly once.",
        );
      }
      seen.add(season);
    }
    for (let index = 1; index < seasons.length; index += 1) {
      if (seasons[index] !== seasons[index - 1] + 1) {
        throw new Error("Season groups must contain contiguous seasons.");
      }
    }
    return seasons;
  });
  if (seen.size !== expected.size) {
    throw new Error(
      "Season groups must contain each TMDB season exactly once.",
    );
  }
  return normalized;
}

export function mapSeasonGroups(
  groups: Array<
    Pick<CollectionMediaSeasonGroup, "id" | "groupOrder" | "displayOrder"> & {
      seasons: Array<{ seasonNumber: number }>;
    }
  >,
  available: number[],
  fallbackDisplayOrder: number,
) {
  if (!groups.length)
    return defaultSeasonGroups(available, fallbackDisplayOrder);
  return groups
    .map((group) => ({
      id: group.id,
      groupOrder: group.groupOrder,
      displayOrder: group.displayOrder,
      seasonNumbers: group.seasons
        .map((season) => season.seasonNumber)
        .sort((left, right) => left - right),
    }))
    .sort((left, right) => left.displayOrder - right.displayOrder);
}

export function appendNewSeasons(
  groups: SeasonGroupView[],
  available: number[],
): SeasonGroupView[] {
  const known = new Set(groups.flatMap((group) => group.seasonNumbers));
  const newSeasons = available.filter((season) => !known.has(season));
  if (!newSeasons.length) return groups;
  const last = groups.at(-1);
  if (!last) return defaultSeasonGroups(available, 0);
  return groups.map((group, index) =>
    index === groups.length - 1
      ? { ...group, seasonNumbers: [...group.seasonNumbers, ...newSeasons] }
      : group,
  );
}

export async function fetchTvSeasons(tmdbId: number) {
  const tv = await getTvDetails(tmdbId);
  return { tv, seasonNumbers: availableSeasonNumbers(tv) };
}
