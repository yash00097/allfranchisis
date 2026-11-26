"use client";

import {
  animate,
  frame,
  type AnimationPlaybackControls,
  motionValue,
} from "motion";
import {
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

// Must match the `rotate-[-8deg] scale-110` classes on the tilted layer.
const TILT = (-8 * Math.PI) / 180;
const SCALE = 1.1;
const COS = Math.cos(TILT);
const SIN = Math.sin(TILT);
const COPIES_X = 3;
// Local px/s per column; even columns drift up, odd columns down.
const DRIFT = [12, 9, 11, 8];
const DRIFT_EASE = 0.6; // seconds to ease drift in/out around a drag
const MAX_COPIES_Y = 6;

const wrap = (value: number, period: number, min: number) =>
  ((((value - min) % period) + period) % period) + min;

type Column = { el: HTMLElement; period: number; index: number };

// Drag state lives in motion values and refs: pointer moves write transforms
// straight to the DOM and never re-render React.
export function InfiniteGrid({
  columns,
  gridClassName,
}: {
  columns: ReactNode[];
  gridClassName: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const measured = useRef({ columns: [] as Column[], periodX: 0, tilesX: 1 });
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const inertia = useRef<AnimationPlaybackControls[]>([]);
  const drift = useRef<number[]>([]);
  const [x] = useState(() => motionValue(0));
  const [y] = useState(() => motionValue(0));
  const [copiesY, setCopiesY] = useState(1);
  const [copiesX, setCopiesX] = useState(1);

  const render = useCallback(() => {
    const { columns: cols, periodX, tilesX } = measured.current;
    const row = rowRef.current;
    if (!row || !periodX) return;
    const sx = x.get();
    const sy = y.get();
    // Screen delta -> the rotated, scaled layer's own axes.
    const lx = (sx * COS + sy * SIN) / SCALE;
    const ly = (sy * COS - sx * SIN) / SCALE;
    const base = tilesX > 1 ? -periodX : 0;
    row.style.transform = `translate3d(${base + wrap(lx, periodX, -periodX / 2)}px,0,0)`;
    for (const { el, period, index } of cols) {
      const offset = ly + (drift.current[index] ?? 0);
      el.style.transform = `translate3d(0,${wrap(offset, period, -period)}px,0)`;
    }
  }, [x, y]);

  const collect = useCallback(() => {
    const row = rowRef.current;
    const grid = row?.firstElementChild;
    if (!row || !(grid instanceof HTMLElement)) return [];
    const gap = Number.parseFloat(getComputedStyle(row).columnGap) || 0;
    const cols: Column[] = [];
    for (const el of row.querySelectorAll<HTMLElement>("[data-column]")) {
      const copy = el.firstElementChild as HTMLElement | null;
      const rowGap = Number.parseFloat(getComputedStyle(el).rowGap) || 0;
      const period = copy?.offsetHeight ? copy.offsetHeight + rowGap : 0;
      if (period > 0)
        cols.push({ el, period, index: Number(el.dataset.column) });
    }
    measured.current = {
      columns: cols,
      periodX: grid.offsetWidth + gap,
      tilesX: row.children.length,
    };
    return cols;
  }, []);

  useLayoutEffect(() => {
    const tilt = tiltRef.current;
    if (!tilt) return;
    const measure = () => {
      const cols = collect();
      const shortest = Math.min(...cols.map(({ period }) => period));
      if (Number.isFinite(shortest)) {
        setCopiesY(
          Math.min(
            MAX_COPIES_Y,
            Math.max(2, Math.ceil(tilt.offsetHeight / shortest) + 1),
          ),
        );
      }
      setCopiesX(COPIES_X);
      render();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(tilt);
    return () => observer.disconnect();
  }, [collect, render]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure after copy counts change the DOM
  useLayoutEffect(() => {
    collect();
    render();
  }, [collect, render, copiesX, copiesY]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const schedule = () => frame.render(render);
    const offX = x.on("change", schedule);
    const offY = y.on("change", schedule);

    // Auto-drift runs only while the wall is on screen and eases out while the
    // user drags or the release inertia is still moving.
    let visible = false;
    let frameId = 0;
    let last = 0;
    let factor = 1;
    const tick = (now: number) => {
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0);
      last = now;
      const busy =
        pointer.current !== null ||
        Math.abs(x.getVelocity()) + Math.abs(y.getVelocity()) > 20;
      const target = busy || reduced.matches ? 0 : 1;
      factor += (target - factor) * (1 - Math.exp(-dt / DRIFT_EASE));
      if (factor > 0.001) {
        DRIFT.forEach((speed, index) => {
          const direction = index % 2 ? 1 : -1;
          drift.current[index] =
            (drift.current[index] ?? 0) + direction * speed * factor * dt;
        });
        render();
      }
      frameId = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      if (visible && !frameId) {
        last = 0;
        frameId = requestAnimationFrame(tick);
      } else if (!visible) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
    });
    observer.observe(root);

    return () => {
      offX();
      offY();
      observer.disconnect();
      cancelAnimationFrame(frameId);
      for (const controls of inertia.current) controls.stop();
    };
  }, [render, x, y]);

  const stopInertia = () => {
    for (const controls of inertia.current) controls.stop();
    inertia.current = [];
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>, glide: boolean) => {
    if (pointer.current?.id !== event.pointerId) return;
    pointer.current = null;
    rootRef.current?.releasePointerCapture?.(event.pointerId);
    if (
      !glide ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    inertia.current = [x, y].map((value) =>
      animate(value, 0, {
        type: "inertia",
        velocity: value.getVelocity(),
        power: 0.9,
        timeConstant: 320,
        restDelta: 0.5,
      }),
    );
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: decorative pointer-only drag surface inside an aria-hidden wall
    <div
      ref={rootRef}
      className="absolute inset-0 cursor-grab touch-pan-y select-none overscroll-x-contain active:cursor-grabbing"
      onDragStart={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        if (pointer.current || (event.pointerType === "mouse" && event.button))
          return;
        stopInertia();
        pointer.current = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const last = pointer.current;
        if (last?.id !== event.pointerId) return;
        x.set(x.get() + event.clientX - last.x);
        y.set(y.get() + event.clientY - last.y);
        last.x = event.clientX;
        last.y = event.clientY;
      }}
      onPointerUp={(event) => endDrag(event, true)}
      onPointerCancel={(event) => endDrag(event, false)}
      onLostPointerCapture={(event) => endDrag(event, false)}
    >
      <div
        ref={tiltRef}
        className="-top-1/4 absolute inset-x-0 h-[150%] rotate-[-8deg] scale-110"
      >
        <div ref={rowRef} className="flex h-full gap-3 will-change-transform">
          {Array.from({ length: copiesX }, (_, tile) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length copies
              key={tile}
              className={cn(
                "grid w-full shrink-0 items-start gap-3",
                gridClassName,
              )}
            >
              {columns.map((column, index) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: static column order
                  key={index}
                  data-column={index}
                  className="flex flex-col gap-3 will-change-transform last:hidden lg:last:flex"
                  style={{ marginTop: index % 2 ? "-12%" : 0 }}
                >
                  {Array.from({ length: copiesY }, (_, copy) => (
                    <div
                      // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length copies
                      key={copy}
                      data-copy
                      className="flex flex-col gap-3"
                    >
                      {column}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
