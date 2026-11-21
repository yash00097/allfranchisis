"use client";

import { cn } from "cn";
import { Check, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const COPIED_MS = 2000;

export function CollectionShareButton({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function share() {
    setError(null);
    const url = `${window.location.origin}${window.location.pathname}`;
    try {
      // Touch devices get the native sheet; desktops expect a pasteable link.
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), COPIED_MS);
    } catch (shareError) {
      if (
        shareError instanceof DOMException &&
        shareError.name === "AbortError"
      )
        return;
      setError("Could not share this link.");
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn(
          "size-11 bg-background dark:bg-background dark:hover:bg-muted",
          copied && "text-primary hover:text-primary",
        )}
        aria-label={copied ? "Link copied" : `Share ${name}`}
        onClick={share}
      >
        {copied ? (
          <Check aria-hidden="true" className="size-5" />
        ) : (
          <Share2 aria-hidden="true" className="size-5" />
        )}
      </Button>
      <span role="status" className="sr-only">
        {copied ? "Link copied" : ""}
      </span>
      {error ? (
        <p
          role="alert"
          className="max-w-64 border bg-background p-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
