"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { cn } from "cn";

const SPEED_PX_PER_FRAME = 0.5;
const EDGE_DWELL_MS = 900;

export function AutoScrollRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let direction = 1;
    let dwellUntil = 0;
    let hover = false;
    let focus = false;
    let dragging = false;
    const paused = () => hover || focus || dragging;

    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      if (paused() || now < dwellUntil) return;

      const max = el.scrollWidth - el.clientWidth;
      if (max <= 1) return;

      const next = el.scrollLeft + direction * SPEED_PX_PER_FRAME;
      if (next >= max) {
        el.scrollLeft = max;
        direction = -1;
        dwellUntil = now + EDGE_DWELL_MS;
        return;
      }
      if (next <= 0) {
        el.scrollLeft = 0;
        direction = 1;
        dwellUntil = now + EDGE_DWELL_MS;
        return;
      }
      el.scrollLeft = next;
    };

    const onEnter = () => {
      hover = true;
    };
    const onLeave = () => {
      hover = false;
    };
    const onFocusIn = () => {
      focus = true;
    };
    const onFocusOut = () => {
      focus = false;
    };
    const onDown = () => {
      dragging = true;
    };
    const onUp = () => {
      dragging = false;
    };

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", onFocusOut);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-nowrap gap-2 overflow-x-auto pb-1",
        "[@media(prefers-reduced-motion:no-preference)]:[scrollbar-width:none]",
        "[@media(prefers-reduced-motion:no-preference)]:[&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}
