<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AllFranchisis — Project Roadmap & Architecture Guide

> Read this file before making any change. It is the source of truth for architecture, current phase, and agent rules.

## 1. Project Overview

**AllFranchisis** is a centralized platform for exploring movies, TV series, and related media that belong to the same fictional universe or franchise.

Purpose: let users navigate interconnected franchises and their individual media entries in one place. A franchise may contain movies, TV series (with seasons and episodes), spin-offs, and related works.

Long-term goals:
- Catalog media hierarchically: universe → franchise → series → season → episode.
- Model relationships between media (sequels, prequels, spin-offs, adaptations, crossovers).
- Independent ratings and reviews at **multiple levels**: individual episode, movie, TV series, and whole franchise.
- Search, filtering, and discovery across all entity types.
- User collections and watchlists.

## 2. Technology Stack

**Record actual installed versions — do not guess.** Verify with `npm ls <pkg>` or by reading `package.json` / `package-lock.json`. Values below reflect the versions declared in `package.json` at setup time; re-verify after any install.

| Concern | Choice | Version (package.json) |
|---|---|---|
| Framework | Next.js (App Router) | `16.3.8` |
| UI runtime | React / React DOM | `19.2.8` |
| Language | TypeScript (strict) | `^5` |
| Runtime | Node.js LTS | `24.18.0` |
| Package manager | npm | `11.16.0` |
| Styling | Tailwind CSS (v4) | `^4` (via `@tailwindcss/postcss ^4`) |
| Component primitives | shadcn + Base UI | `shadcn ^4.21.1`, `@base-ui/react ^1.8.0` |
| ORM | Prisma CLI | `^7.10.0` |
| ORM client | `@prisma/client` | `^7.10.0` |
| DB driver | `@prisma/adapter-neon` | `^7.10.0` |
| Database | PostgreSQL (hosted on Neon) | serverless Postgres |
| Linter/Formatter | **Biome** (not ESLint/Prettier) | `2.4.2` |
| Auth | Clerk (`@clerk/nextjs`, `@clerk/ui`) | `^7.9.10`, `^1.38.1` |
| Error monitoring | Sentry (`@sentry/nextjs`) | `^11.4.0` |
| External media data | TMDB REST API (server-only) | n/a |

Notes / deviations from the original brief:
- **Linting uses Biome, not ESLint.** `npm run lint` runs `biome check`; formatting runs `biome format --write`. Do not reintroduce ESLint.
- Node target in `tsconfig.json` is `ES2017` with `lib: dom, esnext`; `moduleResolution: bundler`.
- TypeScript is `strict: true`. `any` is disallowed unless explicitly justified in a comment.

## 3. Project Architecture

Intended separation of concerns:

```
src/
  app/            # Next.js App Router: routes, layouts, pages (Server Components by default)
    api/webhooks/clerk/  # Clerk webhook route handler
    dashboard/collections/actions.ts  # Server Actions (manager-gated mutations)
  components/
    ui/           # shadcn/Base UI primitives (button, card, dialog, table, ...)
  hooks/          # Reusable client hooks (e.g. use-mobile.ts)
  lib/
    prisma.ts     # Shared PrismaClient (pg adapter, Neon pooler) via getPrismaClient()
    auth/         # Clerk → User sync, collection-manager gating
    collections/  # Collection read queries (incl. landing-queries.ts); cache.ts = unstable_cache tags + invalidation
    franchises/   # Franchise read queries (cached, tags collections + franchises)
    tmdb/         # Server-only TMDB service, image helpers, types
  generated/
    prisma/       # Generated Prisma Client (gitignored — never edit by hand)
  proxy.ts        # Clerk middleware (Next 16: proxy.ts, NOT middleware.ts)
  instrumentation.ts / instrumentation-client.ts / sentry.*.config.ts
prisma/
  schema.prisma   # Single source of truth for the DB schema
  migrations/     # Committed migration history
prisma7.config.ts # Prisma 7 config: schema path, migrations path, datasource url
```

Layer boundaries:
- **UI** (`app/`, `components/`) — presentation only. Server Components by default; `"use client"` only when interactivity requires it.
- **Server-side logic** — data fetching, mutations, validation. Runs on the server (Server Components, Route Handlers, Server Actions). Never expose `DATABASE_URL` or Prisma to the browser.
- **Database access** (`lib/`) — a single shared Prisma Client exposed by `lib/prisma.ts` as `getPrismaClient()`, memoized on `globalThis` for dev hot-reload and wired to Neon's pooled endpoint through `@prisma/adapter-pg`. Never construct another client; every DB module imports `server-only`.
- **External data** (`lib/tmdb/`) — server-only TMDB access (details, search, seasons, image URLs). All TMDB modules import `server-only`.
- **Shared types** — colocate with the module that owns them; promote to a shared location only when reused across layers. Prefer Prisma-generated types.

Path aliases: `@/*` → `./src/*` (see `tsconfig.json`).

## 4. Database Architecture

The database layer currently contains the Phase 2 foundation, the Phase 3–4 catalog entities, the Phase 5 `Franchise` grouping, and Phase 8 per-user collection watch status, favorites, and watchlist. Do not add entities from later phases without explicit authorization.

Implemented database surface:
- PostgreSQL is configured through Prisma 7 and `prisma7.config.ts`. The schema declares no `datasource url`; the CLI reads it from `prisma7.config.ts` and the runtime supplies it to the Neon adapter.
- Migrations: `20261002123421_init` (`User`), `20261002162635_add_clerk_identity` (Clerk linkage), `20261003170000_add_collections_media` (`Collection`, `MediaItem`, `CollectionMedia`, `MediaType` enum), `20261010120000_add_collection_genres` (`Collection.genres`), `20261013120000_add_user_collection_status` (`WatchStatus` enum, `UserCollectionStatus`), `20261022120000_add_user_collection_favorite` (`UserCollectionFavorite`; applied to Neon on October 25, 2026), `20261117104930_add_media_season_separation` (collection-scoped TV season groups), `20261119120000_add_franchises` (`Franchise`, `FranchiseCollection`; not yet applied to Neon), `20261120120000_add_user_collection_watchlist` (`UserCollectionWatchlist`; not yet applied to Neon).
- Models: `User` (UUID id, unique `clerkId` and `email`, name, createdAt), `Collection` (unique `slug`, name, description, `genres String[]` drawn from the fixed TMDB genre list in `src/lib/collections/genres.ts`, optional cover/backdrop URLs), `MediaItem` (cached TMDB metadata, `@@unique([tmdbId, mediaType])`, enum `MediaType { MOVIE, TV }`), `CollectionMedia` (composite-PK join carrying `displayOrder`), `CollectionMediaSeasonGroup` (collection/media-scoped contiguous season group carrying global `displayOrder`), `CollectionMediaSeason` (season membership keyed by group and season number), `UserCollectionStatus` (per-user status for a whole `Collection`, composite PK `(userId, collectionId)`, `status WatchStatus { WATCHING | WATCHED }`, both FKs cascade — explicitly **not** per `MediaItem`).
- `Franchise` (unique `slug`, name, description, optional cover/backdrop URLs) is the top-level grouping and contains **only collections** through `FranchiseCollection` (composite PK `(franchiseId, collectionId)`, `displayOrder`, `addedAt`, both FKs cascade). Many-to-many: one collection may sit in several franchises. Deleting a franchise removes join rows only; collections are kept. Reads are in `src/lib/franchises/queries.ts`; mutations are manager-gated Server Actions in `src/app/dashboard/franchises/actions.ts` that return `{ error?: string }` for expected failures.
- Generated Prisma Client code lives under `src/generated/prisma` and must never be edited by hand.
- `UserCollectionFavorite` stores collection favorites independently of watch status: composite PK `(userId, collectionId)`, `createdAt`, cascading User/Collection FKs, indexes `(userId, createdAt)` and `collectionId`. Relations are `User.collectionFavorites` and `Collection.userFavorites`.
- `UserCollectionWatchlist` stores per-user watchlist collections independently of status and favorites: composite PK `(userId, collectionId)`, `createdAt`, cascading User/Collection FKs, indexes `(userId, createdAt)` and `collectionId`; relations `User.collectionWatchlist`, `Collection.userWatchlist`. Reads in `src/lib/watchlist/queries.ts` (`getCollectionWatchlisted`, `listUserWatchlistCollections`); `setCollectionWatchlist` in `src/app/collections/actions.ts` (user-gated, idempotent, returns `{ error }`) revalidates the detail route and `/watchlist`. Status changes and manager mutations also revalidate `/watchlist`.
- Favorite reads in `src/lib/favorites/queries.ts` are server-only: single/batched membership and newest-first library reads with media counts. `setCollectionFavorite` in `src/app/collections/actions.ts` authenticates through `requireCurrentUser()`, resolves a slug, accepts exactly `"true"`/`"false"`, and uses idempotent create/delete writes scoped to the current user. Successful favorite/status changes refresh `/collections`, collection detail, `/watching`, `/watched`, and `/favorites`; status changes and manager mutations also refresh `/watchlist`.

Core concepts:
- **Users**.
- **Franchises** — top-level groupings.
- **Movies** — standalone film entries.
- **TV series** — with nested **seasons** and **episodes**.
- **Media relationships** — directed/typed links between entries (sequel, prequel, spin-off, adaptation, crossover, same-continuity).
- **Ratings & reviews** — must support **multiple levels independently**: an individual episode, a movie, a whole TV series, and an entire franchise. Design the rating target polymorphically (e.g. a target type + target id) so any entity level can be rated without schema churn.

Design principles for Phase 2:
- Model hierarchy explicitly (parent/child) rather than overloading one table.
- Use enums for media type, relationship type, and rating target level.
- Keep rating aggregation derivable (histogram / averages) — do not store stale counters without a refresh strategy.

## 5. Development Roadmap

- **Phase 1 — Foundation (complete):** Next.js + TypeScript + Tailwind v4 + Prisma 7 foundation.
- **Phase 2 — Database architecture and Prisma schema design (complete):** PostgreSQL datasource, Prisma schema, generated client, and initial `User` migration are in place.
- **Phase 3 — Authentication and user profiles (complete):** Clerk auth (`src/proxy.ts` middleware), webhook + lazy user sync into `User`, manager-gated `/dashboard`, sign-in/sign-up routes, Sentry wiring.
- **Phase 4 — Franchise and media catalog (partial):** TMDB-backed `MediaItem` cache, media detail pages at `/media/[mediaType]/[tmdbId]`, editor-curated `Collection`/`CollectionMedia` and collection-scoped TV season separation surfaced at `/collections` and `/dashboard/collections`. Franchise grouping now lives in Phase 5.
- **Phase 5:** Media relationships and franchise hierarchy — partial. `Franchise` groups collections (many-to-many, manager-ordered) at `/franchises`, `/franchises/[slug]`, managed at `/dashboard/franchises`. No universe level and no media relationship model (sequel/prequel/spin-off) yet.
- **Phase 6:** Individual ratings and reviews — not started. Ratings shown in the UI are read-through TMDB scores, not stored user ratings.
- **Phase 7:** Search, filtering, and discovery — not started as a route. Only client-side filtering exists (`CollectionBrowser` filters by name, `CollectionMediaBrowser` filters by type/animated and sorts by order/alpha/release/rating).
- **Phase 8:** User collections, watchlists, and reading lists — partial. Per-user watchlist (`UserCollectionWatchlist`, `/watchlist`) is implemented (migration not yet deployed). Per-user `In Progress`/`Completed` status (`UserCollectionStatus`, `/watching`, `/watched`) and independent collection favorites (`UserCollectionFavorite`, `/favorites`) are implemented and deployed. Per-user collections and reading lists do not exist. The underlying `Collection`/`CollectionMedia` entity is still a single editor-owned curated list, not per-user data.
- **Phase 9:** Admin tools and content management — early slice only. `/dashboard/collections` + `CollectionManager` cover collection CRUD, TMDB ingestion, and ordering for one hardcoded owner (`COLLECTION_MANAGER_CLERK_ID`). No general roles, moderation, or audit tooling.
- **Phase 10:** Performance optimization, security, testing, and deployment — partial. Sentry is wired (client web vitals via default `browserTracingIntegration`, 10% sample). Functions run in `cle1` (`vercel.json`) next to Neon `us-east-2`. Public collection reads (`listCollections`, `listCollectionGenres`, `getCollectionBySlug`: 1 h; `listCollectionDiscovery`: 5 min) are cached server-side with `unstable_cache` in `src/lib/collections/`, tagged `collections` / `collection-discovery`; every manager mutation calls `invalidateCollections()`, and favorite/status actions expire `collection-discovery` via `revalidateTag(tag, { expire: 0 })`. Never cache per-user reads. Sidebar, mobile-logo and collection-card links use `prefetch`; `experimental.staleTimes.dynamic = 30` reuses dynamic pages client-side for 30 s. Images: TMDB backdrops `w1280` + `srcSet`, posters/covers `srcSet`/`sizes`, below-fold `loading="lazy"`, first collection card and heroes `fetchPriority="high"` (`CollectionCard` `imagePriority` / `imagePriorityFor`). TMDB reads are cached 1 hour. Benchmark plan and results: `docs/superpowers/plans/2026-11-18-site-performance.md`, `docs/perf/2026-11-site-performance-results.md`. There is no test runner, no CI config, and no rate limiting.

## 6. Coding Standards

- TypeScript strict mode; strong typing. Avoid `any` unless explicitly justified.
- Reusable, modular components. No premature abstractions.
- Server Components by default; Client Components only for interactivity.
- Database access server-side only. Never import Prisma into client code.
- Secure env handling: secrets stay server-side; never prefix with `NEXT_PUBLIC_` unless intentionally public.
- Error handling: Sentry captures unhandled client, server, edge, request, and render errors. Report unexpected errors caught by application code with `Sentry.captureException(error)` before returning a fallback response; handle expected validation and user-facing failures locally without reporting them as incidents.
- Consistent naming/formatting (Biome enforces this — run before committing).
- Validate inputs at system boundaries; handle errors explicitly.
- Follow current Next.js (App Router) and Prisma 7 best practices.
- Inspect installed docs in `node_modules/next/dist/docs/` before using unfamiliar APIs.

## 7. AI Agent Instructions

- **Read this file before making project changes.**
- **Check `graphify-out/graph.json` and `graphify-out/GRAPH_REPORT.md` before broad repository exploration.** Use graphify queries and traversal results to identify relevant files and relationships, reducing token usage; run or update graphify when the graph is missing or stale.
- **`/collections` is the home page; `/` is a landing page.** Never point a new "home" link, redirect, or default route at `/`. See §11.
- **Respect the current phase.** Phases 3–4 are complete/partial as described in §5 and §8. Do not implement features from later phases without explicit authorization.
- **Update this file** whenever architectural decisions, dependencies, or completed phases materially change — and at the end of **every session in which project files were modified** if the change is material. A change is material when it adds or removes routes, pages, components, models, migrations, env vars, dependencies, or scripts, or when it moves a phase's completion state. Do not update it for pure formatting, comment, or refactor-only changes with no surface change; in that case say so explicitly instead of editing. Stale phase/status text is a bug: fix §5 and §8 in the same session that makes them stale.
- **Do not silently replace selected technologies.** Confirm before swapping anything in §2.
- **Verify compatibility** (versions, peer deps) before upgrading dependencies.
- Avoid unnecessary abstractions, dependencies, and code.
- **Never overwrite existing work without inspecting it first.**
- Preserve the auto-managed `nextjs-agent-rules` block above — `next dev` rewrites it.

### Branch and Submission Rules

- Work directly on the currently checked-out `main` branch.
- Do not create, switch to, or request another branch for task work.
- Do not commit changes after submitting the task. Leave the working tree changes available for the user to review and commit.
- Do not reset, stash, or discard existing user changes. Inspect and work around them.
- Before submission, run the narrowest relevant validation and report its result; do not create a commit as part of validation.

## 8. Current Project Status

**Phases 1–3 are complete. Phase 5 is partial: franchises group collections; media relationships do not exist. Phase 4 is partial: TMDB-backed catalog browsing and editor-curated collections exist; user-owned collections do not. Phase 8 is partial: per-user In Progress/Completed status and independent favorites over collections are implemented and deployed, and a per-user watchlist is implemented (migration not yet deployed); per-user collections and reading lists do not exist.**

Completed:
- [x] Next.js 16 App Router scaffold with TypeScript (strict), Tailwind v4, `@/*` alias.
- [x] Biome configured for lint + format (`lint` / `format` scripts).
- [x] shadcn / Base UI component primitives added under `src/components/ui`.
- [x] Prisma 7 installed with `prisma7.config.ts` (schema, migrations path, datasource url from env).
- [x] Migrations `20261002123421_init`, `20261002162635_add_clerk_identity`, `20261003170000_add_collections_media`, `20261010120000_add_collection_genres`, `20261013120000_add_user_collection_status` applied to the schema.
- [x] Favorites schema and additive migration `20261022120000_add_user_collection_favorite` added, generated, and applied to the configured Neon database on October 25, 2026.
- [x] `.gitignore` excludes `.env*` and `/src/generated/prisma`.
- [x] Shared Prisma Client singleton in `src/lib/prisma.ts` (Neon adapter).
- [x] npm scripts for `typecheck` plus Prisma commands (`db:generate`, `db:validate`, `db:migrate`).
- [x] Phase 3 auth: Clerk middleware (`src/proxy.ts`), sign-in/sign-up routes, Clerk webhook syncing `User`, `syncCurrentUser()` lazy sync, `COLLECTION_MANAGER_CLERK_ID`-gated dashboard actions.
- [x] Sentry instrumentation (`src/instrumentation*.ts`, `src/sentry.*.config.ts`, `withSentryConfig`).
- [x] Phase 4 partial: TMDB service layer, `MediaItem` cache, media detail pages, collections browse + manager UI with drag reorder, and URL-driven genre filtering on `/collections`.
- [x] Phase 4 partial: collection-scoped TV season groups with derived contiguous labels, public group display, independent global group ordering, explicit TMDB refresh, and append-to-final-group synchronization.
- [x] Phase 8 partial: per-user `In Progress`/`Completed` status for whole collections (`UserCollectionStatus`), the user-gated `setCollectionStatus` Server Action, per-user status badges on `/collections`, the `CollectionStatusControl` in the collection hero, and signed-in `/watching` + `/watched` views.
- [x] Phase 8 partial: independent collection favorites, user-gated `setCollectionFavorite`, reusable accessible heart on collection detail (none on cards), protected `/favorites` with watch-status badges and newest-first order, and signed-in Favorites navigation. Favorite state comes from server revalidation; no optimistic state or extra client fetch.
- [x] Phase 8 partial: per-user collection watchlist — `UserCollectionWatchlist` + migration `20261120120000_add_user_collection_watchlist` (created, **not yet deployed** to Neon), user-gated `setCollectionWatchlist`, `/watchlist` page, Watchlist sidebar item (first under Your library), `CollectionWatchlistButton` on collection detail via shared `CollectionToggleButton`. No watchlist control on cards.
- [x] Phase 5 partial: `Franchise` + `FranchiseCollection` schema and migration `20261119120000_add_franchises` (created, **not yet deployed** to Neon), public `/franchises` + `/franchises/[slug]`, Franchises sidebar item, manager CRUD + ordering at `/dashboard/franchises`.

Open items:
- Verification update (October 25, 2026): `npx prisma migrate status` confirmed one pending migration, then the separately approved `npx prisma migrate deploy` applied `20261022120000_add_user_collection_favorite` successfully. All six migrations are now applied.
- Local validation update (October 25, 2026): `npm run db:validate`, `npm run db:generate`, `npm run typecheck`, and `npm run build` passed. `npm run lint` still reports 11 existing violations in shared UI primitives.
- Environment update (October 25, 2026): `.env` contains `DATABASE_URL`, but neither `TMDB_API_Read_Access_Token` nor `TMDB_API_Key` is set.
- [x] Live DB connectivity and migration state verified on October 25, 2026 with `npx prisma migrate status`; all six committed migrations are applied to Neon.
- [x] Favorites migration applied with approval on October 25, 2026. Database persistence, account isolation, cascades, and signed-in browser interactions still need application-level verification.
- [ ] No test runner is configured. Validation is `npm run typecheck`, `npm run lint`, `npm run build` (see §9).
- [ ] TMDB credentials (`TMDB_API_Read_Access_Token` or `TMDB_API_Key`) must be present in `.env`; the service throws without them.

**Current phase:** Phase 4 (partial) — catalog and collections; Phase 5 (partial) — franchises over collections; Phase 8 (partial) — per-user collection watch status, favorites, and watchlist. Next: Phase 5 media relationships, then Phase 6.

Page-by-page UI inventory: see §11.

## 9. Validation & Testing

Run these checks before claiming work is verified. Do not fabricate results; clearly separate checks that passed from those needing Neon credentials.

| Check | Command | Requires Neon? |
|---|---|---|
| Next.js builds/starts | `npm run dev` / `npm run build` | No |
| Type check | `npm run typecheck` (`tsc --noEmit`) | No |
| Lint/format | `npm run lint` (`biome check`) | No |
| Prisma schema valid | `npm run db:validate` (`prisma validate`) | No |
| Prisma Client generated | `npm run db:generate` (`prisma generate`) | No |
| Env wiring | `DATABASE_URL` referenced in `prisma7.config.ts` | Yes |
| Live DB / migrations applied | `npx prisma migrate status` / `npx prisma migrate deploy` | **Yes** |

No test runner is configured. Live database connectivity is not verified here — `DATABASE_URL` is required.

## 10. Command Reference

```bash
npm install                      # install deps
npm run typecheck                # tsc --noEmit
npm run lint                     # biome check
npm run format                   # biome format --write
npm run db:generate              # prisma generate
npm run db:validate              # prisma validate
npm run db:migrate -- --name X   # prisma migrate dev (needs DATABASE_URL)
npx prisma migrate deploy        # apply migrations in prod (needs DATABASE_URL)
npx prisma migrate status        # check applied migrations (needs DATABASE_URL)
npx prisma studio                # browse DB
npm run dev                      # start dev server
npm run build && npm start       # production build + serve
```

## 11. Page & UI Map

Every route is a Server Component. Client Components exist only where noted.

**Routing rule — `/collections` is the app's home page.** `/` is a marketing landing page only and is not the default destination. Any "go home" link, post-auth redirect, nav default, or new entry point must target `/collections`, never `/`. Currently that means: the logo/wordmark links in `AppSidebar` (`src/components/app-sidebar.tsx`) and `LandingHeader` (`src/components/landing-header.tsx`), and `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` in `.env` (`.env` is gitignored — the same values must be set in the deployment environment, or sign-in lands on `/` in production).

| Route | File | Purpose |
|---|---|---|
| `/` | `src/app/page.tsx` | Marketing hero landing — **not** the home page |
| `/collections` | `src/app/collections/page.tsx` | **Default home** — public collection grid |
| `/collections/[slug]` | `src/app/collections/[slug]/page.tsx` | One collection + its media |
| `/collections/[slug]/media/[mediaType]/[tmdbId]` | `src/app/collections/[slug]/media/[mediaType]/[tmdbId]/page.tsx` | TMDB detail opened from a collection |
| `/dashboard` | `src/app/dashboard/page.tsx` | Authenticated profile home |
| `/dashboard/collections` | `src/app/dashboard/collections/page.tsx` | Owner-only manager workspace |
| `/watching` | `src/app/watching/page.tsx` | Signed-in user's collections marked In Progress |
| `/watched` | `src/app/watched/page.tsx` | Signed-in user's collections marked Completed |
| `/favorites` | `src/app/favorites/page.tsx` | Signed-in user's favorite collections, newest first |
| `/watchlist` | `src/app/watchlist/page.tsx` | Signed-in user's watchlist collections, newest first |
| `/franchises` | `src/app/franchises/page.tsx` | Public franchise grid |
| `/franchises/[slug]` | `src/app/franchises/[slug]/page.tsx` | One franchise + its ordered collections |
| `/dashboard/franchises` | `src/app/dashboard/franchises/page.tsx` | Owner-only franchise manager |
| `/media/[mediaType]/[tmdbId]` | `src/app/media/[mediaType]/[tmdbId]/page.tsx` | TMDB movie/TV detail |
| `/sign-in`, `/sign-up` | `src/app/sign-in|sign-up/[[...sign-in|sign-up]]/page.tsx` | Clerk catch-all routes |

Shared chrome lives in `src/components/site-shell.tsx` (`SiteShell`, `"use client"`). It branches on `usePathname()`: `/` renders `LandingHeader` (`"use client"`, a floating translucent bar fixed `top-3`, logo + Collections + theme + auth, with a full-height mobile menu panel), while every other route renders the sidebar shell — `SidebarProvider` → `AppSidebar` (`collapsible="icon"`) plus a content column with the sticky `SiteHeader` (`SidebarTrigger`, theme) above the page. Nav items come from `src/components/site-nav.ts` (`NAV_GROUPS`): Browse (`Collections`, `Franchises`), Your library (`Watchlist`, `In Progress`, `Completed`, `Favorites`, signed-in only), Manage (`Dashboard`, manager only). Active state uses `isNavItemActive` (exact or prefix match on `pathname`). Sidebar collapsed state persists in the `sidebar_state` cookie, read server-side in `src/app/layout.tsx` and passed as `defaultSidebarOpen`. The landing page is reachable by direct URL only, and already-signed-in visitors are redirected to `/collections` by `src/proxy.ts`. The landing header overlays the page (it is not in flow); the hero is `min-h-dvh` with `pt-32` to### Home (`/`)

Marketing landing page, reachable by direct URL only and only for signed-out visitors (`src/proxy.ts` redirects signed-in users to `/collections`) — the default home is `/collections`. `force-dynamic` Server Component built to the `.claude/skills/landing-page-design` rules, with a hybrid visual: flat black/white landing surfaces plus the app's red `primary` and 0px radius.

- Data comes from `getLandingData()` (`src/lib/collections/landing-queries.ts`, `unstable_cache` 5 min, tags `collections` + `collection-discovery`): collection/movie/TV counts for media in at least one collection, up to 28 posters by TMDB vote count, and the largest collection's first 8 entries. The page also reads `listCollectionDiscovery()` and `listCollectionGenres()`. If any read throws, the error goes to Sentry and the page renders without data-driven sections.
- Sections in order: hero over `PosterWall`, recently updated collections, problem/solution with the featured collection's watch order, four benefits, `TaglineReveal`, three steps, live library counts + genre chips + most favorited, FAQ (`<details>` + FAQPage JSON-LD), final CTA, footer with TMDB attribution. The single CTA is "Explore collections" → `/collections`; account copy is "Browse without an account. Create an account to track your progress." Do not claim the account is free, and do not add invented stats or testimonials.
- Landing components live in `src/components/landing/`: `font.ts` (Geist via `next/font/google`, applied only to the landing page and `LandingHeader`), `poster-wall.tsx` (server, `aria-hidden` tilted poster columns that drift with CSS), `reveal.tsx` (client, IntersectionObserver scroll reveal, once), `tagline-reveal.tsx` (client, word-by-word opacity driven by a `requestAnimationFrame`-throttled scroll listener).
- Landing styles are in `src/app/globals.css` under "LANDING PAGE": `--landing-*` color tokens (exposed as `bg-landing-bg`, `text-landing-fg`, etc.), named text-style utilities (`heading-1`…`heading-6`, `title-*`, `body-*`, `button-*`, `caption-*`), the hero gradient text, and `landing-*` motion classes using `cubic-bezier(0.22, 1, 0.36, 1)`. All motion respects `prefers-reduced-motion`.
- `HomeCarousel` and the `.home-carousel*` CSS were removed. `public/franchise/1..4.png` are no longer referenced.

 with an `ArrowRight`.

### Collections (`/collections`)

The app's default home page and the post-sign-in/sign-up destination. Header block (kicker "Explore", `font-heading` h1 "Collections", lede), then `GenreFilterBar`, then either unfiltered discovery rows or the genre-filtered `CollectionBrowser` (`"use client"`).

- `GenreFilterBar` (Server Component, `src/components/genre-filter-bar.tsx`) sits directly below the header block: a single-line horizontally scrolling row of bordered chips, one per genre in use. There is no "All" chip; the Collections navigation destination returns to the unfiltered view. Chips are `<Link>`s, so selecting one navigates to `/collections?genre=<Genre>` and re-runs the Prisma query server-side — genre filtering is URL-driven, not client state. The selected genre chip is solid `primary` (red), the rest are `primary`-outlined; all radii are 0 via the sharp-edge theme. The chip list comes from `listCollectionGenres()` (genres actually in use, in `COLLECTION_GENRES` order), not from the filtered result, so the bar survives a zero-result genre.
- The chip row is `AutoScrollRow` (`src/components/auto-scroll-row.tsx`, `"use client"`), which the Server Component fills with already-rendered `<GenreChip>` children. It hides the native scrollbar and marquees the row horizontally at `0.5px` per frame, reversing direction with a 900ms dwell at each end. It pauses while the pointer is over the row, while any chip has focus, and during a pointer drag (`pointerdown`/`pointerup`/`pointercancel`); it does nothing when `scrollWidth - clientWidth <= 1`, so a chip set that fits neither scrolls nor shows a bar. `prefers-reduced-motion: reduce` skips the animation loop AND the scrollbar-hiding classes, so reduced-motion users keep a visible, normally scrollable bar.
- Invalid or unknown `?genre=` values (including repeated params) fall back to the unfiltered discovery view via `isCollectionGenre()`. A genre with no matches shows an `Empty` with a "Show all collections" link. The name search input in `CollectionBrowser` remains client-side and narrows within the genre-filtered set.
- A max-w-md, icon-prefixed search input filters collections by name in memory on both the default discovery view and genre-filtered view — there is no server-side search.
- With a genre selected, all matching collections render in a `sm:3 / lg:4` grid of `CollectionCard`; cards use 70% width on phones.
- Without a genre filter, `CollectionDiscovery` shows up to four cards per row for `Recently added & updated` (ordered by `Collection.updatedAt`), `Most favorites` (ranked by total users who favorited each collection), and `Most watched` (ranked by users marked `WATCHED`), in that order. Rows stay horizontal and scroll on narrow screens. Favorite and watched rankings aggregate across users.
- Signed-in viewers also see per-user watch state: the page resolves the current user (`getCurrentUser()`), looks up visible collection `WatchStatus` values via `getCollectionStatuses`, and passes them through as optional `status` props. Signed-out viewers get no status.
- `CollectionCard`: cover image on a `bg-muted` panel (`object-contain`, or a "No cover image" placeholder), then title, right-aligned "N items" count, a `line-clamp-3` description, and the collection's genre badges; when a `status` is present it also renders an `In Progress`/`Completed` badge beside the title. The whole card is a link to the detail route. Cover URLs starting with `http` are used as-is; otherwise they are treated as TMDB paths and expanded via `tmdbImage(..., "w780")`. The genre row is hidden entirely when the collection has no genres.
- Empty states use the shadcn `Empty` primitive: no collections at all (page-level) vs. a filter miss. `CollectionBrowser` takes optional `emptyTitle` / `emptyDescription` props (defaults "No collections found" / "Try a different collection name.") so `/watching` and `/watched` can supply their own empty copy.

### Collection detail (`/collections/[slug]`)

`force-dynamic`. A bordered hero band with an optional backdrop image, a `bg-background/85` scrim over it, and an optional 2:3 cover (`w-40`) sitting beside: an "All collections" back link, badges (total items / movies / shows), the collection's genre badges, a 4xl → 6xl `font-heading` h1, and the description. A `CollectionStatusControl` (Server Component, `src/components/collection-status-control.tsx`) sits under the description: signed-out viewers see a `SignInButton`-wrapped prompt; signed-in viewers see `In Progress`/`Completed` submit buttons (plus a `Remove` button when a status is set) posting to the user-gated `setCollectionStatus` Server Action. The page resolves the viewer's current status via `getCollectionStatus`. Body is `CollectionMediaBrowser`, or a plain "This collection has no media yet." panel. Missing slug → `notFound()`.

Signed-in viewers also see `CollectionFavoriteButton` (heart) and `CollectionWatchlistButton` (bookmark) beside the title; both wrap the shared `CollectionToggleButton` (`src/components/collection-toggle-button.tsx`, `"use client"`: 44px target, `aria-pressed`, pending disable/`aria-busy`, `role="alert"` errors, `useTransition` sends the opposite state, refreshed props supply displayed state). `CollectionCard` renders no favorite or watchlist control. Every visitor, signed out included, also sees `CollectionShareButton` (`src/components/collection-share-button.tsx`, `"use client"`, `Share2` icon): touch devices (`navigator.share` + `(pointer: coarse)`) open the native share sheet; other devices copy `location.origin + location.pathname` and show "Link copied" for 2 s; a dismissed sheet (`AbortError`) is silent. `generateMetadata` gives each collection its own title (`<name> · AllFranchisis`), description (falls back to `SITE_DESCRIPTION` in `src/lib/site.ts`) and Open Graph/Twitter image for link previews: cover poster `w500` first (WhatsApp drops images over ~600 KB; external backdrops can exceed that), else backdrop `w1280`; Twitter card is `summary` for posters, `summary_large_image` only for a backdrop. Favorite, watchlist and watch status load in parallel using `getCollectionFavorite`, `getCollectionWatchlisted` and `getCollectionStatus`; the three states remain independent.

Cards inside a collection link to the **nested** media route (`/collections/<slug>/media/<type>/<id>`), not `/media/...`, so the media page can offer a back link to that collection. `MediaCard` takes an optional `collectionSlug` prop for this; `CollectionMediaBrowser` forwards it from the collection page.

### `CollectionMediaBrowser` (`"use client"`)

Filter row — All / Movies / TV shows / Animated movies / Animated series — plus four icon sort buttons: collection order (default), alphabetical, release date, TMDB rating. Filters and sorts are client-side only. Grid is `sm:2 / lg:4 / xl:5` of `MediaCard`; a filter that matches nothing shows an `Empty`.

`MediaCard`: 2:3 poster on muted background (`object-contain`), `Movie`/`TV show` badge plus an `Animated` outline badge, `line-clamp-2` title, footer line with year and `TMDB n.n`, and a `line-clamp-3` overview. Links to `/media/{movie|tv}/{tmdbId}`.

### Dashboard (`/dashboard`)

`force-dynamic` + `auth.protect()`. Calls `getCurrentUser()` (DB row first; falls back to `syncCurrentUser()`, the lazy half of Clerk → `User` sync, only when the row is missing), greets the user by name, and shows a "Manage collections" link only when `isCollectionManager()` is true.

### Manager workspace (`/dashboard/collections`)

`force-dynamic` + `auth.protect()`. Non-managers get an "owner-only" notice with a link back to `/collections`; managers get `CollectionManager` (`"use client"`, the largest component at ~500 lines): a create-collection card (name, optional slug, description, cover/backdrop URLs), a TMDB search card that adds movies/TV to a selected collection, and a per-collection card listing current media with ordering controls and removal. Every mutation is a Server Action from `src/app/dashboard/collections/actions.ts`, each guarded by `requireCollectionManager()`.

The create and edit forms both include a `GenreMultiselect` dropdown (`src/components/genre-multiselect.tsx`) that submits one `genres` entry per ticked genre; the actions sanitise that list against the fixed TMDB vocabulary in `src/lib/collections/genres.ts`, which drops unknown values and canonicalises the order.

### In Progress & Completed (`/watching`, `/watched`)

Both are `force-dynamic` + `auth.protect()`, signed-in only (the header links and the `src/proxy.ts` matcher gate them). Each resolves the current user (`getCurrentUser()`) and loads that user's collections for its status via `listUserCollectionsByStatus` (`WATCHING` / `WATCHED`), tags each with its `status`, batch-loads favorite membership, and renders the shared `CollectionBrowser` under a "Your library" header with status-specific empty copy.

### Franchises (`/franchises`, `/franchises/[slug]`, `/dashboard/franchises`)

`/franchises` (`force-dynamic`) renders a `sm:3 / lg:4` grid of `FranchiseCard` (`src/components/franchise-card.tsx`, Server Component: cover, name, "N collections", `line-clamp-3` description) from cached `listFranchises()`, or an `Empty` "No franchises yet". `/franchises/[slug]` (`force-dynamic`, `notFound()` on unknown slug) shows a hero like collection detail (backdrop, scrim, cover, "All franchises" back link, collection-count badge, h1, description) and the franchise's collections in manager `displayOrder` through `CollectionBrowser`, with per-user status badges batch-loaded like `/collections` (cards show no hearts). `setCollectionStatus`/`setCollectionFavorite` revalidate `/franchises` as a layout so status badges refresh there. `/dashboard/franchises` (`auth.protect()` + `isCollectionManager()`, owner-only notice otherwise) renders `FranchiseManager` (`"use client"`): create/edit/delete franchises, add collections from a select of non-members, remove, and up/down reorder with "Save collection order". Errors from actions render inline with `role="alert"`. `/dashboard` links to it as "Manage franchises".

### Favorites (`/favorites`)

`force-dynamic` + `auth.protect()`, also protected by `src/proxy.ts`. `listUserFavoriteCollections` returns only the current user's favorites, ordered by favorite `createdAt desc`, then `collectionId asc`, with media counts. Batched watch statuses retain In Progress/Completed badges. The shared `CollectionBrowser` renders searchable cards with `isFavorite: true`; empty copy is "No favorites yet" / "Click the heart on a collection to add it to your favorites." Removing the final favorite re-renders this empty state. Manager collection mutations invalidate `/favorites` alongside their existing `/collections` invalidation.

### Watchlist (`/watchlist`)

`force-dynamic` + `auth.protect()`, also protected by `src/proxy.ts`. `listUserWatchlistCollections` returns only the current user's watchlist, newest first. Batched watch statuses keep In Progress/Completed badges. Renders the shared `CollectionBrowser` under a "Your library" header; empty copy is "Your watchlist is empty" / "Click the bookmark on a collection to add it to your watchlist."

### Media detail (`/media/[mediaType]/[tmdbId]` and `/collections/[slug]/media/[mediaType]/[tmdbId]`)

Both routes are `revalidate = 3600`, TMDB-backed, and render the same shared component: `src/components/media-detail.tsx` (`MediaDetailView`). The page files only parse params and supply a back link, so media markup changes belong in the component, not the routes. Media detail is untouched by per-user watch status — it renders no per-user data and watch status is collection-level only.

`MediaDetailView` props: `mediaType`, `tmdbId`, optional `season` (from `?season=`), `basePath` (empty at the root route; `/collections/<slug>` inside a collection, used to keep season-switch links in the same context), `backHref`, and `backLabel`. Renders backdrop hero, poster, type/TMDB-score badges, and metadata; TV additionally resolves the season through `getTvSeasonDetails`. Invalid id or non-`movie`/`tv` segment → `notFound()`.

The nested route additionally loads the collection by slug and 404s if it is missing, and uses its name for the back label. It does **not** verify that the requested media actually belongs to the collection.

### Theming

Custom "DOOM 64" OKLCH palette in `src/app/globals.css`, defined for light (`:root`) and dark (`.dark`) with a `@theme inline` block mapping the tokens to Tailwind color utilities. Dark mode is class-based and toggled by `src/components/theme-toggle.tsx`. Display headings rely on the `font-heading` utility.
