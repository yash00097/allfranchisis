"use client";

import { Fragment, useEffect, useRef, useState } from "react";

export function TaglineReveal({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = lines.map((line) => line.split(" "));
  const total = words.flat().length;
  const [active, setActive] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActive(total);
      return;
    }
    let frame = 0;
    // Progress runs from the text top crossing 80% of the viewport to its bottom crossing 50%.
    const update = () => {
      frame = 0;
      const { top, height } = node.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = (vh * 0.8 - top) / (height + vh * 0.3);
      setActive(Math.round(Math.min(Math.max(progress, 0), 1) * total));
    };
    const onScroll = () => {
      frame ||= requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [total]);

  let index = 0;
  return (
    <p
      ref={ref}
      className="heading-4 sm:heading-3 lg:heading-2 mx-auto max-w-[680px] text-center text-landing-fg"
    >
      {words.map((line, lineIndex) => (
        <Fragment key={lines[lineIndex]}>
          {lineIndex > 0 ? <br /> : null}
          {line.map((word, wordIndex) => {
            const position = index++;
            return (
              <Fragment key={`${word}-${position}`}>
                {wordIndex > 0 ? " " : null}
                <span
                  className="landing-word"
                  data-active={position < active ? "" : undefined}
                >
                  {word}
                </span>
              </Fragment>
            );
          })}
        </Fragment>
      ))}
    </p>
  );
}
