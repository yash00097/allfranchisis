# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

`AGENTS.md` is the source of truth for architecture, phases, and agent rules. The sections below add commands, data flow, and gotchas that are not obvious from the roadmap file.

## Commands

```bash
npm run dev          # Next.js dev server (rewrites the nextjs-agent-rules block in AGENTS.md)
npm run build        # prisma generate && next build
npm start            # serve production build
npm run lint         # biome check (NOT eslint)
npm run format       # biome format --write
npm run typecheck    # tsc --noEmit
npm run db:generate  # prisma generate
npm run db:validate  # prisma validate
npm run db:migrate   # prisma migrate dev
npx prisma migrate deploy   # apply migrations (needs DATABASE_URL)
npx prisma studio           # browse DB
```

No test runner is configured. Validation = `npm run typecheck` + `npm run lint` + `npm run build`; DB-touching checks additionally need a live `DATABASE_URL`.

## Architecture

Next.js 16 App Router, React Server Components by default. Request flow:

- `src/proxy.ts` — Clerk middleware. Next 16 renamed middleware to **proxy**; do not create `middleware.ts`. Protects `/dashboard(.*)`, allows `/api/webhooks(.*)`, matcher also covers `/__clerk/(.*)`.
- `src/app/**/page.tsx` — Server Components read through `src/lib/*` and render `src/components/*`. DB-backed pages set `export const dynamic = "force-dynamic"`; TMDB-backed media pages set `export const revalidate = 3600`.
- `src/app/dashboard/collections/actions.ts` — all mutations are Server Actions (`"use server"`), each starting with `requireCollectionManager()`, ending with `revalidatePath(...)`.
- Client Components (`"use client"`) exist only for interaction: `collection-browser`, `collection-manager`, `collection-media-browser`, `home-carousel`, `theme-toggle`. They receive serialized props and call Server Actions.

Layers under `src/lib/` (each DB/auth/TMDB module imports `server-only`):

- `prisma.ts` — `getPrismaClient()`, the single lazily-created `PrismaClient` with the `PrismaNeon` adapter, memoized on `globalThis` for dev hot-reload. Call it; never construct a client elsewhere.
- `auth/` — `upsertClerkUser` (idempotent, resolves clerkId/email collisions in a transaction), `syncCurrentUser` (lazy sync from `currentUser()`), `collection-manager` (`requireCollectionManager` / `isCollectionManager`).
- `collections/queries.ts` — read queries (`listCollections`, `getCollectionBySlug`, ...), re-exported from `lib/collections`.
- `tmdb/` — `service.ts` (fetch wrapper: 8s timeout, one retry on network error, `revalidate: 3600`), `images.ts` (`tmdbImage(path, size)` → full URL or `null`), `types.ts`.

`src/app/api/webhooks/clerk/route.ts` verifies the Clerk webhook and upserts/deletes the local `User`. Auth state is therefore synced two ways: eagerly by webhook, lazily by `syncCurrentUser()` on the dashboard.

## Data model

Defined in `prisma/schema.prisma`; migrations in `prisma/migrations/`. Prisma 7 style — the schema has **no `datasource url`**; the connection string is supplied by `prisma7.config.ts` (CLI) and the Neon adapter (runtime). Generated client output is `src/generated/prisma` (gitignored, never edit).

- `User` — `clerkId` and `email` both unique; maps Clerk identity to a local row.
- `MediaItem` — cached TMDB metadata keyed by `@@unique([tmdbId, mediaType])`; `mediaType` enum `MOVIE | TV`.
- `Collection` / `CollectionMedia` — join carries `displayOrder`; reordering rewrites the whole set in one `$transaction`.

## Environment

`.env` is gitignored. Server-only: `DATABASE_URL`, `DATABASE_URL_POOLED`, `CLERK_SECRET_KEY`, `TMDB_API_Read_Access_Token` (preferred) / `TMDB_API_Key` (fallback), `COLLECTION_MANAGER_CLERK_ID` (Clerk user id allowed to mutate collections). Public: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`, `NEXT_PUBLIC_SENTRY_DSN`.

## Gotchas

- `/collections` is the home page. `/` is a marketing landing page only. New "go home" links, redirects, and nav defaults must target `/collections` — including `NEXT_PUBLIC_CLERK_SIGN_{IN,UP}_FALLBACK_REDIRECT_URL` in `.env` (gitignored; set it in the deployment env too).
- `LayoutProps<"/">` and route-typed helpers come from Next 16's generated types — check `node_modules/next/dist/docs/` before using unfamiliar APIs.
- Errors: unhandled errors go to Sentry automatically (`src/instrumentation*.ts`, `sentry.*.config.ts`, `next.config.ts` wraps with `withSentryConfig`). Report unexpected caught errors via `Sentry.captureException(error)`; handle expected validation failures locally.
- Styling: Tailwind v4 via `@tailwindcss/postcss`, custom "DOOM 64" OKLCH palette in `src/app/globals.css`, dark mode via a `.dark` class toggled by `theme-toggle`. shadcn config is `style: base-nova` in `components.json`; primitives live in `src/components/ui` (Base UI-based).
- Biome is the only linter/formatter; `lint` and `typecheck` are separate.
