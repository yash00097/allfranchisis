<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AllFranchisis — Project Roadmap & Architecture Guide

> Read this file before making any change. It is the source of truth for architecture, current phase, and agent rules.

## 1. Project Overview

**AllFranchisis** is a centralized platform for exploring movies, TV series, books, and other media that belong to the same fictional universe or franchise.

Purpose: let users navigate interconnected franchises and their individual media entries in one place. A franchise may contain movies, TV series (with seasons and episodes), books (standalone or in series), spin-offs, and related works.

Long-term goals:
- Catalog media hierarchically: universe → franchise → series → season → episode / book → chapter.
- Model relationships between media (sequels, prequels, spin-offs, adaptations, crossovers).
- Independent ratings and reviews at **multiple levels**: individual episode, book, movie, TV series, and whole franchise.
- Search, filtering, and discovery across all entity types.
- User collections, watchlists, and reading lists.

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

Notes / deviations from the original brief:
- **Linting uses Biome, not ESLint.** `npm run lint` runs `biome check`; formatting runs `biome format --write`. Do not reintroduce ESLint.
- Node target in `tsconfig.json` is `ES2017` with `lib: dom, esnext`; `moduleResolution: bundler`.
- TypeScript is `strict: true`. `any` is disallowed unless explicitly justified in a comment.

## 3. Project Architecture

Intended separation of concerns:

```
src/
  app/            # Next.js App Router: routes, layouts, pages (Server Components by default)
  components/
    ui/           # shadcn/Base UI primitives (button, card, dialog, table, ...)
  hooks/          # Reusable client hooks (e.g. use-mobile.ts)
  lib/            # Framework-agnostic helpers (cn, future db client, validation)
  generated/
    prisma/       # Generated Prisma Client (gitignored — never edit by hand)
prisma/
  schema.prisma   # Single source of truth for the DB schema
  migrations/     # Committed migration history
prisma7.config.ts # Prisma 7 config: schema path, migrations path, datasource url
```

Layer boundaries:
- **UI** (`app/`, `components/`) — presentation only. Server Components by default; `"use client"` only when interactivity requires it.
- **Server-side logic** — data fetching, mutations, validation. Runs on the server (Server Components, Route Handlers, Server Actions). Never expose `DATABASE_URL` or Prisma to the browser.
- **Database access** (`lib/`) — a single shared Prisma Client instance. Not yet created; add it in the phase that first needs DB reads/writes (see Roadmap). One instance per process; guard against hot-reload duplication in dev.
- **Shared types** — colocate with the module that owns them; promote to a shared location only when reused across layers. Prefer Prisma-generated types.

Path aliases: `@/*` → `./src/*` (see `tsconfig.json`).

## 4. Database Architecture

The database layer currently contains the Phase 2 foundation. Do not add entities from later phases without explicit authorization.

Implemented database surface:
- PostgreSQL is configured through Prisma 7 and `prisma7.config.ts`.
- `User` is the first persisted domain model with UUID identifiers, required names, unique email addresses, and creation timestamps.
- Migration `20261002123421_init` creates the `User` table and its unique email index.
- Generated Prisma Client code lives under `src/generated/prisma` and must never be edited by hand.

Core concepts:
- **Users**.
- **Franchises** — top-level groupings.
- **Movies** — standalone film entries.
- **TV series** — with nested **seasons** and **episodes**.
- **Books** — standalone, or grouped into **book series**.
- **Media relationships** — directed/typed links between entries (sequel, prequel, spin-off, adaptation, crossover, same-continuity).
- **Ratings & reviews** — must support **multiple levels independently**: an individual episode, a book, a movie, a whole TV series, and an entire franchise. Design the rating target polymorphically (e.g. a target type + target id) so any entity level can be rated without schema churn.

Design principles for Phase 2:
- Model hierarchy explicitly (parent/child) rather than overloading one table.
- Use enums for media type, relationship type, and rating target level.
- Keep rating aggregation derivable (histogram / averages) — do not store stale counters without a refresh strategy.

## 5. Development Roadmap

- **Phase 1 — Foundation (complete):** Next.js + TypeScript + Tailwind v4 + Prisma 7 foundation.
- **Phase 2 — Database architecture and Prisma schema design (complete):** PostgreSQL datasource, Prisma schema, generated client, and initial `User` migration are in place.
- **Phase 3 — Authentication and user profiles (CURRENT):** Build on the existing `User` model; do not redesign the database foundation without a concrete requirement.
- **Phase 4:** Franchise and media catalog.
- **Phase 5:** Media relationships and franchise hierarchy.
- **Phase 6:** Individual ratings and reviews.
- **Phase 7:** Search, filtering, and discovery.
- **Phase 8:** User collections, watchlists, and reading lists.
- **Phase 9:** Admin tools and content management.
- **Phase 10:** Performance optimization, security, testing, and deployment.

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
- **Respect the current phase.** Phase 3 is current. Do not implement features from later phases without explicit authorization.
- **Update this file** whenever architectural decisions, dependencies, or completed phases materially change.
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

**Phase 2 is complete. Phase 3 authentication and user profiles are next. No user-facing application features are implemented yet.**

Completed:
- [x] Next.js 16 App Router scaffold with TypeScript (strict), Tailwind v4, `@/*` alias.
- [x] Biome configured for lint + format (`lint` / `format` scripts).
- [x] shadcn / Base UI component primitives added under `src/components/ui`.
- [x] Prisma 7 installed with `prisma7.config.ts` (schema, migrations path, datasource url from env).
- [x] Initial migration `20261002123421_init` creating a minimal `User` table.
- [x] `.gitignore` excludes `.env*` and `/src/generated/prisma`.
- [x] Phase 2 database foundation documented: PostgreSQL datasource, `User` model, initial migration, and generated Prisma Client.

Pending foundation verification:
- [ ] Install dependencies (`node_modules` not yet present).
- [ ] Create `.env` with `DATABASE_URL` (Neon) — **not yet provided; live DB connectivity NOT verified**.
- [ ] Add shared Prisma Client singleton in `src/lib`.
- [ ] Add npm scripts for `typecheck` and Prisma commands (`db:generate`, `db:migrate`, `db:push`, `db:studio`).
- [ ] Validate: `tsc`, `biome check`, `prisma validate`, `prisma generate` (see §Validation).

**Current phase:** Phase 3 — Authentication and user profiles.

## 9. Validation & Testing

Run these checks before claiming the foundation setup is verified. Do not fabricate results; clearly separate checks that passed from those needing Neon credentials.

| Check | Command | Requires Neon? |
|---|---|---|
| Next.js builds/starts | `npm run dev` / `npm run build` | No |
| Type check | `npx tsc --noEmit` | No |
| Lint/format | `npm run lint` | No |
| Prisma schema valid | `npx prisma validate` | No |
| Prisma Client generated | `npx prisma generate` | No |
| Env wiring | `DATABASE_URL` referenced in `prisma7.config.ts` | Yes |
| Live DB / migration applied | `npx prisma migrate deploy` | **Yes** |

No live database connection has been verified — no `DATABASE_URL` supplied.

## 10. Command Reference

```bash
npm install                      # install deps
npx prisma generate              # generate Prisma Client (after install)
npx prisma validate              # validate schema
npx prisma migrate dev --name X  # create + apply a migration (needs DATABASE_URL)
npx prisma migrate deploy        # apply migrations in prod (needs DATABASE_URL)
npx prisma studio                # browse DB
npm run dev                      # start dev server
npm run build && npm start       # production build + serve
npm run lint                     # biome check
npx tsc --noEmit                 # type check
```
