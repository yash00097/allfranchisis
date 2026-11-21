"use client";

import { cn } from "cn";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { COLLECTION_GENRES } from "@/features/collections/genres";

export function GenreMultiselect({
  name = "genres",
  id,
  defaultValue = [],
  onValueChange,
  className,
}: {
  name?: string;
  id: string;
  defaultValue?: string[];
  onValueChange?: (genres: string[]) => void;
  className?: string;
}) {
  const [selected, setSelected] = useState(defaultValue);

  function toggle(genre: string, checked: boolean) {
    const next = checked
      ? [...selected, genre]
      : selected.filter((item) => item !== genre);
    setSelected(next);
    onValueChange?.(next);
  }

  return (
    <div className={cn("grid gap-2", className)}>
      {selected.map((genre) => (
        <input key={genre} type="hidden" name={name} value={genre} />
      ))}
      <Label htmlFor={id}>Genres</Label>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              className="w-fit justify-between"
            />
          }
        >
          {selected.length ? `${selected.length} selected` : "Select genres"}
          <ChevronDown />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Collection genres</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          {COLLECTION_GENRES.map((genre) => (
            <DropdownMenuCheckboxItem
              key={genre}
              checked={selected.includes(genre)}
              onCheckedChange={(checked) => toggle(genre, checked)}
              closeOnClick={false}
            >
              {genre}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {selected.length ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((genre) => (
            <Badge key={genre} variant="secondary">
              {genre}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
