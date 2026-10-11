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
    prisma.ts     # Shared PrismaClient (Neon adapter) via getPrismaClient()
    auth/         # Clerk → User sync, collection-manager gating
    collections/  # Collection read queries
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
- **Database access** (`lib/`) — a single shared Prisma Client exposed by `lib/prisma.ts` as `getPrismaClient()`, memoized on `globalThis` for dev hot-reload and wired to Neon through `@prisma/adapter-neon`. Never construct another client; every DB module imports `server-only`.
- **External data** (`lib/tmdb/`) — server-only TMDB access (details, search, seasons, image URLs). All TMDB modules import `server-only`.
- **Shared types** — colocate with the module that owns them; promote to a shared location only when reused across layers. Prefer Prisma-generated types.

Path aliases: `@/*` → `./src/*` (see `tsconfig.json`).

## 4. Database Architecture

The database layer currently contains the Phase 2 foundation plus the Phase 3–4 entities. Do not add entities from later phases without explicit authorization.

Implemented database surface:
- PostgreSQL is configured through Prisma 7 and `prisma7.config.ts`. The schema declares no `datasource url`; the CLI reads it from `prisma7.config.ts` and the runtime supplies it to the Neon adapter.
- Migrations: `20261002123421_init` (`User`), `20261002162635_add_clerk_identity` (Clerk linkage), `20261003170000_add_collections_media` (`Collection`, `MediaItem`, `CollectionMedia`, `MediaType` enum), `20261010120000_add_collection_genres` (`Collection.genres`).
- Models: `User` (UUID id, unique `clerkId` and `email`, name, createdAt), `Collection` (unique `slug`, name, description, `genres String[]` drawn from the fixed TMDB genre list in `src/lib/collections/genres.ts`, optional cover/backdrop URLs), `MediaItem` (cached TMDB metadata, `@@unique([tmdbId, mediaType])`, enum `MediaType { MOVIE, TV }`), `CollectionMedia` (composite-PK join carrying `displayOrder`).
- Generated Prisma Client code lives under `src/generated/prisma` and must never be edited by hand.

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
- **Phase 4 — Franchise and media catalog (partial):** TMDB-backed `MediaItem` cache, media detail pages at `/media/[mediaType]/[tmdbId]`, and an editor-curated `Collection`/`CollectionMedia` feature surfaced at `/collections` and `/dashboard/collections`. No franchise hierarchy yet.
- **Phase 5:** Media relationships and franchise hierarchy — not started. No relationship model, no franchise entity.
- **Phase 6:** Individual ratings and reviews — not started. Ratings shown in the UI are read-through TMDB scores, not stored user ratings.
- **Phase 7:** Search, filtering, and discovery — not started as a route. Only client-side filtering exists (`CollectionBrowser` filters by name, `CollectionMediaBrowser` filters by type/animated and sorts by order/alpha/release/rating).
- **Phase 8:** User collections, watchlists, and reading lists — not started. The existing `Collection`/`CollectionMedia` entity is a single editor-owned curated list, not per-user data; treat it as groundwork, not as a completed phase.
- **Phase 9:** Admin tools and content management — early slice only. `/dashboard/collections` + `CollectionManager` cover collection CRUD, TMDB ingestion, and ordering for one hardcoded owner (`COLLECTION_MANAGER_CLERK_ID`). No general roles, moderation, or audit tooling.
- **Phase 10:** Performance optimization, security, testing, and deployment — partial. Sentry is wired, images use Next `Image`/plain `img` with TMDB sizing, and TMDB reads are cached 1 hour; there is no test runner, no CI config, and no rate limiting.

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

**Phases 1–3 are complete. Phase 4 is partial: TMDB-backed catalog browsing and editor-curated collections exist; franchise hierarchy and user-owned collections do not.**

Completed:
- [x] Next.js 16 App Router scaffold with TypeScript (strict), Tailwind v4, `@/*` alias.
- [x] Biome configured for lint + format (`lint` / `format` scripts).
- [x] shadcn / Base UI component primitives added under `src/components/ui`.
- [x] Prisma 7 installed with `prisma7.config.ts` (schema, migrations path, datasource url from env).
- [x] Migrations `20261002123421_init`, `20261002162635_add_clerk_identity`, `20261003170000_add_collections_media` applied to the schema.
- [x] `.gitignore` excludes `.env*` and `/src/generated/prisma`.
- [x] Shared Prisma Client singleton in `src/lib/prisma.ts` (Neon adapter).
- [x] npm scripts for `typecheck` plus Prisma commands (`db:generate`, `db:validate`, `db:migrate`).
- [x] Phase 3 auth: Clerk middleware (`src/proxy.ts`), sign-in/sign-up routes, Clerk webhook syncing `User`, `syncCurrentUser()` lazy sync, `COLLECTION_MANAGER_CLERK_ID`-gated dashboard actions.
- [x] Sentry instrumentation (`src/instrumentation*.ts`, `src/sentry.*.config.ts`, `withSentryConfig`).
- [x] Phase 4 partial: TMDB service layer, `MediaItem` cache, media detail pages, collections browse + manager UI with drag reorder.

Open items:
- [ ] Live DB connectivity is not verified in this workspace; migrations are committed but not confirmed applied to the Neon instance. Run `npx prisma migrate status` with `DATABASE_URL` set to check.
- [ ] No test runner is configured. Validation is `npm run typecheck`, `npm run lint`, `npm run build` (see §9).
- [ ] TMDB credentials (`TMDB_API_Read_Access_Token` or `TMDB_API_Key`) must be present in `.env`; the service throws without them.

**Current phase:** Phase 4 (partial) — catalog and collections. Next unstarted: Phase 5.

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

**Routing rule — `/collections` is the app's home page.** `/` is a marketing landing page only and is not the default destination. Any "go home" link, post-auth redirect, nav default, or new entry point must target `/collections`, never `/`. Currently that means: the header logo/wordmark link in `src/app/layout.tsx`, and `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` in `.env` (`.env` is gitignored — the same values must be set in the deployment environment, or sign-in lands on `/` in production).

| Route | File | Purpose |
|---|---|---|
| `/` | `src/app/page.tsx` | Marketing hero landing — **not** the home page |
| `/collections` | `src/app/collections/page.tsx` | **Default home** — public collection grid |
| `/collections/[slug]` | `src/app/collections/[slug]/page.tsx` | One collection + its media |
| `/collections/[slug]/media/[mediaType]/[tmdbId]` | `src/app/collections/[slug]/media/[mediaType]/[tmdbId]/page.tsx` | TMDB detail opened from a collection |
| `/dashboard` | `src/app/dashboard/page.tsx` | Authenticated profile home |
| `/dashboard/collections` | `src/app/dashboard/collections/page.tsx` | Owner-only manager workspace |
| `/media/[mediaType]/[tmdbId]` | `src/app/media/[mediaType]/[tmdbId]/page.tsx` | TMDB movie/TV detail |
| `/sign-in`, `/sign-up` | `src/app/sign-in|sign-up/[[...sign-in|sign-up]]/page.tsx` | Clerk catch-all routes |

Shared chrome lives in `src/app/layout.tsx`: logo + wordmark (links to `/collections`, the home page), `Collections` link, `ThemeToggle`, and Clerk `Show`/`SignInButton`/`SignUpButton`/`UserButton`. The dashboard link renders only for the configured manager. Because the logo is the only link to `/`, the landing page is reachable by direct URL only. The hero subtracts a hardcoded `73px` header height (`min-h-[calc(100dvh-73px)]`) — changing header padding breaks that offset.

### Home (`/`)

Marketing landing page, reachable by direct URL only — the default home is `/collections`. Full-height hero over a decorative background carousel.

- `HomeCarousel` (`"use client"`) is `aria-hidden` — purely visual, no controls, no dots. It autoplays every 5s (`AUTOPLAY_DELAY`), sliding 4 images listed in the `franchiseImages` array (`public/franchise/1..4.png`). The track is tripled (last + list + list) to fake infinite scroll and snaps back on `transitionEnd`.
- It honors `prefers-reduced-motion` by disabling autoplay, and slide width is responsive: `68vw` mobile, `48vw` ≤1024px, `34vw` wider.
- **All carousel styling is in `src/app/globals.css` under the `.home-carousel*` selectors**, not in the component — restyling the hero means editing both files. `.home-carousel__overlay` (plus a `.dark` variant) darkens the images for text contrast.
- Foreground content is a `max-w-7xl` column: square primary-colored `Library` icon tile, uppercase `AllFranchisis` kicker, `font-heading` h1 "Find the stories that belong together." (5xl → 7xl), muted lede paragraph, and a primary `buttonVariants` link "Explore collections" with an `ArrowRight`.

### Collections (`/collections`)

The app's default home page and the post-sign-in/sign-up destination. Header block (kicker "Explore", `font-heading` h1 "Collections", lede) then `CollectionBrowser` (`"use client"`).

- A max-w-md, icon-prefixed search input filters collections by name in memory — there is no server-side search.
- Results render as a `sm:2 / lg:3` grid of `CollectionCard`.
- `CollectionCard`: cover image on a `bg-muted` panel (`object-contain`, or a "No cover image" placeholder), then title, right-aligned "N items" count, a `line-clamp-3` description, and the collection's genre badges. The whole card is a link to the detail route. Cover URLs starting with `http` are used as-is; otherwise they are treated as TMDB paths and expanded via `tmdbImage(..., "w780")`. The genre row is hidden entirely when the collection has no genres.
- Empty states use the shadcn `Empty` primitive: no collections at all vs. "No collections found" when the filter misses.

### Collection detail (`/collections/[slug]`)

`force-dynamic`. A bordered hero band with an optional backdrop image, a `bg-background/85` scrim over it, and an optional 2:3 cover (`w-40`) sitting beside: an "All collections" back link, badges (total items / movies / shows), the collection's genre badges, a 4xl → 6xl `font-heading` h1, and the description. Body is `CollectionMediaBrowser`, or a plain "This collection has no media yet." panel. Missing slug → `notFound()`.

Cards inside a collection link to the **nested** media route (`/collections/<slug>/media/<type>/<id>`), not `/media/...`, so the media page can offer a back link to that collection. `MediaCard` takes an optional `collectionSlug` prop for this; `CollectionMediaBrowser` forwards it from the collection page.

### `CollectionMediaBrowser` (`"use client"`)

Filter row — All / Movies / TV shows / Animated movies / Animated series — plus four icon sort buttons: collection order (default), alphabetical, release date, TMDB rating. Filters and sorts are client-side only. Grid is `sm:2 / lg:4 / xl:5` of `MediaCard`; a filter that matches nothing shows an `Empty`.

`MediaCard`: 2:3 poster on muted background (`object-contain`), `Movie`/`TV show` badge plus an `Animated` outline badge, `line-clamp-2` title, footer line with year and `TMDB n.n`, and a `line-clamp-3` overview. Links to `/media/{movie|tv}/{tmdbId}`.

### Dashboard (`/dashboard`)

`force-dynamic` + `auth.protect()`. Calls `syncCurrentUser()` (the lazy half of Clerk → `User` sync), greets the user by name, and shows a "Manage collections" link only when `isCollectionManager()` is true.

### Manager workspace (`/dashboard/collections`)

`force-dynamic` + `auth.protect()`. Non-managers get an "owner-only" notice with a link back to `/collections`; managers get `CollectionManager` (`"use client"`, the largest component at ~500 lines): a create-collection card (name, optional slug, description, cover/backdrop URLs), a TMDB search card that adds movies/TV to a selected collection, and a per-collection card listing current media with ordering controls and removal. Every mutation is a Server Action from `src/app/dashboard/collections/actions.ts`, each guarded by `requireCollectionManager()`.

The create and edit forms both include a `GenreMultiselect` dropdown (`src/components/genre-multiselect.tsx`) that submits one `genres` entry per ticked genre; the actions sanitise that list against the fixed TMDB vocabulary in `src/lib/collections/genres.ts`, which drops unknown values and canonicalises the order.

### Media detail (`/media/[mediaType]/[tmdbId]` and `/collections/[slug]/media/[mediaType]/[tmdbId]`)

Both routes are `revalidate = 3600`, TMDB-backed, and render the same shared component: `src/components/media-detail.tsx` (`MediaDetailView`). The page files only parse params and supply a back link, so media markup changes belong in the component, not the routes.

`MediaDetailView` props: `mediaType`, `tmdbId`, optional `season` (from `?season=`), `basePath` (empty at the root route; `/collections/<slug>` inside a collection, used to keep season-switch links in the same context), `backHref`, and `backLabel`. Renders backdrop hero, poster, type/TMDB-score badges, and metadata; TV additionally resolves the season through `getTvSeasonDetails`. Invalid id or non-`movie`/`tv` segment → `notFound()`.

The nested route additionally loads the collection by slug and 404s if it is missing, and uses its name for the back label. It does **not** verify that the requested media actually belongs to the collection.

### Theming

Custom "DOOM 64" OKLCH palette in `src/app/globals.css`, defined for light (`:root`) and dark (`.dark`) with a `@theme inline` block mapping the tokens to Tailwind color utilities. Dark mode is class-based and toggled by `src/components/theme-toggle.tsx`. Display headings rely on the `font-heading` utility.
