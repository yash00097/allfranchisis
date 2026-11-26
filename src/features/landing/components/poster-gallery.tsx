"use client";

import {
  type PointerEvent,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

export type GalleryItem = {
  id: string;
  title: string;
  poster: string | null;
  year: string;
  kind: string;
};

const AUTO_SPEED = 36; // css px per second, content moves left
const FRICTION = 0.32; // seconds, inertia time constant
const EASE = 0.5; // seconds, auto-scroll ease in/out
const RESUME_DELAY = 700; // ms after a touch or drag ends
const ZONE = 0.16; // fraction of the width on each side that disintegrates
const ROW_GAP = 16;

const wrap = (value: number, period: number, min: number) =>
  ((((value - min) % period) + period) % period) + min;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smooth = (a: number, b: number, value: number) => {
  const t = clamp01((value - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const VERTEX = `#version 300 es
precision highp float;
uniform vec2 uView;
uniform vec4 uPoster;
uniform vec2 uGrid;
uniform float uZone;
uniform float uSeed;
in vec2 aCorner;
out vec2 vUv;
out float vAlpha;
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
void main() {
  float id = float(gl_InstanceID);
  vec2 cell = vec2(mod(id, uGrid.x), floor(id / uGrid.x));
  vec2 size = uPoster.zw / uGrid;
  vec2 center = uPoster.xy + (cell + 0.5) * size;
  float edge = min(center.x, uView.x - center.x);
  float t = clamp(1.0 - edge / uZone, 0.0, 1.0);
  float h = hash(cell + uSeed);
  float p = clamp((t - h * 0.75) / 0.25, 0.0, 1.0);
  vAlpha = 1.0 - p * p;
  vUv = (cell + aCorner) / uGrid;
  if (vAlpha <= 0.01) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }
  float dir = center.x < uView.x * 0.5 ? -1.0 : 1.0;
  vec2 drift = vec2(
    dir * p * p * (24.0 + 90.0 * hash(cell * 1.7 + uSeed)),
    (hash(cell * 2.3 + uSeed) - 0.5) * p * 56.0
  );
  vec2 px = center + drift + (aCorner - 0.5) * size * mix(1.0, 0.45, p);
  gl_Position = vec4(
    px.x / uView.x * 2.0 - 1.0,
    1.0 - px.y / uView.y * 2.0,
    0.0,
    1.0
  );
}`;

const FRAGMENT = `#version 300 es
precision mediump float;
uniform sampler2D uTex;
in vec2 vUv;
in float vAlpha;
out vec4 color;
void main() {
  vec4 c = texture(uTex, vUv);
  color = vec4(c.rgb * vAlpha, vAlpha);
}`;

type Renderer = {
  gl: WebGL2RenderingContext;
  uniforms: Record<string, WebGLUniformLocation | null>;
  textures: (WebGLTexture | null)[];
  program: WebGLProgram;
  buffer: WebGLBuffer | null;
};

function createRenderer(canvas: HTMLCanvasElement, count: number) {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: true,
  });
  if (!gl) return null;
  const program = gl.createProgram();
  for (const [type, source] of [
    [gl.VERTEX_SHADER, VERTEX],
    [gl.FRAGMENT_SHADER, FRAGMENT],
  ] as const) {
    const shader = gl.createShader(type);
    if (!shader || !program) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return null;
    gl.attachShader(program, shader);
  }
  if (!program) return null;
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  // biome-ignore lint/correctness/useHookAtTopLevel: WebGL call, not a React hook
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const corner = gl.getAttribLocation(program, "aCorner");
  gl.enableVertexAttribArray(corner);
  gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  const uniforms: Renderer["uniforms"] = {};
  for (const name of ["uView", "uPoster", "uGrid", "uZone", "uSeed"]) {
    uniforms[name] = gl.getUniformLocation(program, name);
  }
  return {
    gl,
    uniforms,
    textures: Array(count).fill(null),
    program,
    buffer,
  } as Renderer;
}

function uploadTexture(gl: WebGL2RenderingContext, image: HTMLImageElement) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.LINEAR_MIPMAP_LINEAR,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

// A cached non-CORS copy of the same URL makes the CORS request fail; reload it
// without the attribute so the poster still shows (it just skips the particles).
function retryWithoutCors({ currentTarget }: SyntheticEvent<HTMLImageElement>) {
  if (!currentTarget.crossOrigin) return;
  currentTarget.removeAttribute("crossorigin");
  const { src } = currentTarget;
  currentTarget.src = src;
}

// Posters are real <img> elements (SSR, no-JS and WebGL-less fallback). Once
// WebGL is up, each loaded <img> doubles as the texture source and is hidden;
// the canvas draws the poster as a grid of squares that scatter near the edges.
// Scroll position lives in refs: frames write transforms, React never re-renders.
export function PosterGallery({ items }: { items: GalleryItem[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rowRef = useRef<HTMLOListElement>(null);
  const [reps, setReps] = useState(1);
  const layout = useRef({ step: 0, width: 0, height: 0, posterW: 0 });
  const motion = useRef({
    scroll: 0,
    auto: 0,
    velocity: 0,
    dragging: false,
    hovering: false,
    resumeAt: 0,
  });
  const pointer = useRef<{
    id: number;
    x: number;
    t: number;
    v: number;
  } | null>(null);
  const redraw = useRef<() => void>(() => {});

  const measure = useCallback(() => {
    const root = rootRef.current;
    const row = rowRef.current;
    const canvas = canvasRef.current;
    const first = row?.firstElementChild as HTMLElement | null;
    const slot = first?.querySelector<HTMLElement>("[data-slot]");
    if (!root || !row || !canvas || !first || !slot) return;
    const width = root.clientWidth;
    const second = first.nextElementSibling as HTMLElement | null;
    const step = second
      ? second.offsetLeft - first.offsetLeft
      : first.offsetWidth + ROW_GAP;
    if (!width || !step) return;
    const top =
      slot.getBoundingClientRect().top - root.getBoundingClientRect().top;
    const height = slot.offsetHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.top = `${top}px`;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    layout.current = { step, width, height, posterW: slot.offsetWidth };
    // Few entries: repeat the list so the strip always spans the viewport.
    const needed = Math.max(
      1,
      Math.ceil((width + 2 * step) / (items.length * step)),
    );
    setReps((current) => (current === needed ? current : needed));
    redraw.current();
  }, [items.length]);

  useLayoutEffect(() => {
    measure();
    const root = rootRef.current;
    if (!root) return;
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [measure]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure when the repeat count changes the DOM
  useLayoutEffect(measure, [measure, reps]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `reps` rebuilds the node list this effect captures
  useEffect(() => {
    const root = rootRef.current;
    const row = rowRef.current;
    const canvas = canvasRef.current;
    if (!root || !row || !canvas) return;
    const nodes = [...row.children] as HTMLElement[];
    const images = nodes.map((node) => node.querySelector("img"));
    const slots = nodes.map((node) =>
      node.querySelector<HTMLElement>("[data-slot]"),
    );
    const renderer = createRenderer(canvas, items.length);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const covered = new Set<number>();
    const failed = new Set<number>();
    let glOk = renderer !== null;
    let visible = false;
    let frameId = 0;
    let last = 0;

    const dropGl = () => {
      glOk = false;
      covered.clear();
      canvas.style.display = "none";
      for (const image of images) if (image) image.style.opacity = "";
      for (const slot of slots) slot?.style.removeProperty("background");
    };
    canvas.style.display = glOk ? "" : "none";
    const onLost = (event: Event) => {
      event.preventDefault();
      dropGl();
    };
    canvas.addEventListener("webglcontextlost", onLost);

    const draw = (now: number) => {
      const { step, width, height, posterW } = layout.current;
      if (!step || !width) return;
      const state = motion.current;
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0);
      last = now;
      if (!state.dragging) {
        const idle = reduced.matches || state.hovering || now < state.resumeAt;
        state.auto +=
          ((idle ? 0 : -AUTO_SPEED) - state.auto) * (1 - Math.exp(-dt / EASE));
        state.velocity *= Math.exp(-dt / FRICTION);
        if (Math.abs(state.velocity) < 1) state.velocity = 0;
        state.scroll += (state.auto + state.velocity) * dt;
      }

      const total = nodes.length;
      const period = total * step;
      const zone = Math.max(80, width * ZONE);
      const cell = posterW < 130 ? 12 : 9;
      const cols = Math.max(6, Math.round(posterW / cell));
      const rows = Math.max(9, Math.round(height / cell));
      let gl: WebGL2RenderingContext | null = null;
      if (glOk && renderer) {
        gl = renderer.gl;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(renderer.uniforms.uView ?? null, width, height);
        gl.uniform2f(renderer.uniforms.uGrid ?? null, cols, rows);
        gl.uniform1f(renderer.uniforms.uZone ?? null, zone);
      }

      for (let i = 0; i < total; i++) {
        const node = nodes[i] as HTMLElement;
        const x = wrap(i * step + state.scroll, period, -step);
        node.style.transform = `translate3d(${x - i * step}px,0,0)`;
        const onScreen = x > -step && x < width;
        if (!onScreen) continue;
        const centre = x + posterW / 2;
        const t = clamp01(1 - Math.min(centre, width - centre) / zone);
        node.style.opacity = String(1 - smooth(0.3, 1, t));
        slots[i]?.style.setProperty(
          "opacity",
          String(1 - smooth(0.05, 0.4, t)),
        );
        if (!gl || !renderer) continue;
        const index = i % items.length;
        const image = images[i];
        if (
          !renderer.textures[index] &&
          image?.complete &&
          image.naturalWidth
        ) {
          try {
            renderer.textures[index] = uploadTexture(gl, image);
          } catch {
            // Tainted (no CORS) image: leave that poster as a plain <img>.
            failed.add(index);
          }
        }
        const texture = renderer.textures[index];
        if (!texture) continue;
        if (image && !covered.has(i)) {
          image.style.opacity = "0";
          slots[i]?.style.setProperty("background", "transparent");
          covered.add(i);
        }
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform4f(renderer.uniforms.uPoster ?? null, x, 0, posterW, height);
        gl.uniform1f(renderer.uniforms.uSeed ?? null, index * 7.31);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, cols * rows);
      }
    };

    const tick = (now: number) => {
      draw(now);
      frameId = requestAnimationFrame(tick);
    };
    const start = () => {
      if (frameId || !visible) return;
      last = 0;
      frameId = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frameId);
      frameId = 0;
    };
    redraw.current = () => draw(performance.now());

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      if (visible) start();
      else stop();
    });
    observer.observe(root);

    return () => {
      stop();
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      redraw.current = () => {};
      if (renderer) {
        for (const texture of renderer.textures) {
          renderer.gl.deleteTexture(texture);
        }
        renderer.gl.deleteBuffer(renderer.buffer);
        renderer.gl.deleteProgram(renderer.program);
      }
    };
  }, [items.length, reps]);

  const release = (event: PointerEvent<HTMLDivElement>, glide: boolean) => {
    const drag = pointer.current;
    if (drag?.id !== event.pointerId) return;
    pointer.current = null;
    const state = motion.current;
    state.dragging = false;
    state.resumeAt = performance.now() + RESUME_DELAY;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const fresh = performance.now() - drag.t < 80;
    state.velocity = glide && !reduced && fresh ? drag.v : 0;
    state.auto = 0;
    rootRef.current?.releasePointerCapture?.(event.pointerId);
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: pointer-only drag surface; entries stay in the list below
    <div
      ref={rootRef}
      className="relative cursor-grab touch-pan-y select-none overflow-hidden overscroll-x-contain active:cursor-grabbing"
      onDragStart={(event) => event.preventDefault()}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") motion.current.hovering = true;
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") motion.current.hovering = false;
      }}
      onPointerDown={(event) => {
        if (pointer.current || (event.pointerType === "mouse" && event.button))
          return;
        pointer.current = {
          id: event.pointerId,
          x: event.clientX,
          t: performance.now(),
          v: 0,
        };
        Object.assign(motion.current, { dragging: true, velocity: 0, auto: 0 });
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const drag = pointer.current;
        if (drag?.id !== event.pointerId) return;
        const now = performance.now();
        const dx = event.clientX - drag.x;
        const dt = Math.max(1, now - drag.t);
        motion.current.scroll += dx;
        drag.v = Math.max(
          -3000,
          Math.min(3000, drag.v * 0.6 + (dx / dt) * 1000 * 0.4),
        );
        drag.x = event.clientX;
        drag.t = now;
      }}
      onPointerUp={(event) => release(event, true)}
      onPointerCancel={(event) => release(event, false)}
      onLostPointerCapture={(event) => release(event, false)}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute left-0 z-10"
      />
      <ol ref={rowRef} className="flex gap-4">
        {Array.from({ length: items.length * reps }, (_, i) => {
          const item = items[i % items.length] as GalleryItem;
          const index = i % items.length;
          return (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-order repeats of a static list
              key={i}
              aria-hidden={i >= items.length || undefined}
              className="flex w-[112px] shrink-0 flex-col gap-3 will-change-transform sm:w-[136px] lg:w-[168px]"
            >
              <div className="flex items-center gap-3" aria-hidden="true">
                <span className="landing-mono caption-3 text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="h-px flex-1 bg-landing-line" />
              </div>
              <div
                data-slot
                className="relative aspect-[2/3] w-full bg-landing-raised ring-1 ring-landing-line"
              >
                {item.poster ? (
                  <img
                    src={item.poster}
                    alt={`${item.title} poster`}
                    crossOrigin="anonymous"
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    onError={retryWithoutCors}
                    className="absolute inset-0 size-full object-cover"
                  />
                ) : (
                  <span className="caption-5 absolute inset-0 flex items-center justify-center p-3 text-center text-landing-muted">
                    No poster
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <span className="sr-only">Entry {index + 1}:</span>
                <span className="title-4 line-clamp-2 text-landing-fg">
                  {item.title}
                </span>
                <span className="caption-5 text-landing-muted">
                  <span className="landing-mono">{item.year}</span>
                  {" · "}
                  {item.kind}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
