"use client";

import { useEffect, useRef, useState } from "react";

const DURATION = 1400;
// Close to the landing curve cubic-bezier(0.22, 1, 0.36, 1).
const easeOut = (t: number) => 1 - (1 - t) ** 4;
const format = (n: number) => n.toLocaleString("en-US");

export function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const node = ref.current;
    if (!node || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setShown(0);
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / DURATION, 1);
          setShown(Math.round(easeOut(t) * value));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <>
      <span ref={ref} aria-hidden="true">
        {format(shown)}
      </span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}
