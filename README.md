<div align="center">

<img src="public/logo.svg" alt="AllFranchisis logo" width="120" />

# AllFranchisis

**Every movie, show and spin-off of a franchise, in one place and in the right order.**

[![Live site](https://img.shields.io/badge/Live-allfranchisis.vercel.app-c0392b?style=for-the-badge&logo=vercel&logoColor=white)](https://allfranchisis.vercel.app/collections)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-2ea44f?style=for-the-badge&logo=github)](#-contributing)

![Next.js](https://img.shields.io/badge/Next.js_16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_7-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Neon_Postgres-4169E1?logo=postgresql&logoColor=white)
![Clerk](https://img.shields.io/badge/Clerk-6C47FF?logo=clerk&logoColor=white)
![TMDB](https://img.shields.io/badge/TMDB-01B4E4?logo=themoviedatabase&logoColor=white)

</div>

---

## 🎬 What is AllFranchisis?

Big franchises are hard to follow. Films, series, animated spin-offs and specials come out of order, sit on different services, and nobody agrees on the watch order.

AllFranchisis puts each universe in one place. Editors curate **collections**: ordered lists of movies, TV shows and specific season ranges. Collections are grouped into **franchises**. Signed-in users track their progress across all of them.

## ✨ How it helps you

| | Feature | What you get |
|---|---|---|
| 🗂️ | **Curated collections** | Movies, TV shows and season ranges in a hand-picked watch order. Each entry is numbered (`#01`, `#02`, …). |
| 🧭 | **Franchises** | Related collections grouped under one roof, so you see the whole universe at once. |
| 🔎 | **Search & filters** | Search by name, filter by genre, and sort by watch order, title, release date or TMDB rating. |
| 📺 | **Rich media pages** | Posters, backdrops, ratings and season details from TMDB. |
| 🔖 | **Watchlist** | Save collections you plan to start. |
| ⏯️ | **Progress tracking** | Mark a collection *In Progress* or *Completed*. |
| ❤️ | **Favorites** | Keep the collections you love in one list. |
| 🔗 | **Easy sharing** | One-tap share on mobile, copy link on desktop, with rich link previews. |
| 🌗 | **Light & dark themes** | A custom sharp-edged theme in both modes. |

> Browsing needs no account. Create an account to track your progress.

## 📌 Scope & roadmap

```mermaid
flowchart LR
    F[🧭 Franchise] --> C1[🗂️ Collection]
    F --> C2[🗂️ Collection]
    C1 --> M[🎞️ Movie]
    C1 --> T[📺 TV show]
    T --> S[Season range]
```

| Status | Area |
|---|---|
| ✅ | Next.js, Prisma and Postgres foundation |
| ✅ | Authentication with Clerk |
| 🟡 | TMDB-backed catalog and curated collections |
| 🟡 | Franchises over collections (media relationships such as sequel and spin-off are next) |
| 🟡 | Watchlist, progress and favorites (per-user custom lists are next) |
| ⬜ | Ratings and reviews at episode, movie, series and franchise level |
| ⬜ | Server-side search and discovery |
| ⬜ | Admin roles and moderation |

The full roadmap and architecture guide is in [AGENTS.md](AGENTS.md).

## 🧱 Tech stack

```mermaid
flowchart LR
    U([Browser]) --> N[Next.js 16 App Router<br/>Server Components + Server Actions]
    N --> CL[Clerk<br/>auth]
    N --> P[Prisma 7] --> DB[(Neon Postgres)]
    N --> TM[TMDB API<br/>media data]
    N --> SE[Sentry<br/>errors]
```

- **Framework:** Next.js 16 (App Router), React 19, TypeScript (strict)
- **Styling:** Tailwind CSS v4, shadcn + Base UI primitives, `motion`
- **Data:** Prisma 7 with `@prisma/adapter-pg` on Neon Postgres
- **Auth:** Clerk
- **Media data:** TMDB
- **Monitoring:** Sentry
- **Lint/format:** Biome

## 🚀 Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 24 LTS and npm
- A PostgreSQL database. A free [Neon](https://neon.tech/) project works.
- A [Clerk](https://clerk.com/) application (free tier is enough)
- A [TMDB](https://www.themoviedb.org/settings/api) API read access token
- Optional: a [Sentry](https://sentry.io/) project for error monitoring

### 1. Clone and install

```bash
git clone https://github.com/yash00097/allfranchisis.git
cd allfranchisis
npm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```bash
# Database (Neon: use the direct URL for migrations, the pooled URL at runtime)
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
DATABASE_URL_POOLED="postgresql://user:password@host-pooler/db?sslmode=require"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SIGNING_SECRET="whsec_..."   # only needed to test the user-sync webhook
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/collections"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/collections"

# TMDB (read access token preferred; API key is the fallback)
TMDB_API_Read_Access_Token="eyJ..."
# TMDB_API_Key="..."

# Your Clerk user id (user_...). This account can create and edit collections and franchises.
COLLECTION_MANAGER_CLERK_ID="user_..."

# Optional
NEXT_PUBLIC_SENTRY_DSN=""
```

> ⚠️ `.env` is gitignored. Never commit real keys.

### 3. Set up the database

```bash
npm run db:generate          # generate the Prisma client
npx prisma migrate deploy    # apply all migrations
```

### 4. Run it

```bash
npm run dev
```

Open [http://localhost:3000/collections](http://localhost:3000/collections). Sign in with the account whose id is in `COLLECTION_MANAGER_CLERK_ID`. Then open `/dashboard/collections` to create your first collection and add titles from TMDB.

### Useful scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Generate the Prisma client and build for production |
| `npm start` | Serve the production build |
| `npm run typecheck` | Type-check with `tsc --noEmit` |
| `npm run lint` | Lint with Biome |
| `npm run format` | Format with Biome |
| `npm run db:migrate` | Create and apply a new migration (dev) |
| `npx prisma studio` | Browse the database |

## 🤝 Contributing

Contributions are welcome: bug fixes, features from the roadmap, UI polish and docs.

1. **Fork** the repo and create a branch from `main`.
2. **Read [AGENTS.md](AGENTS.md)** first. It describes the architecture, conventions and current phase.
3. **Make your change.** Keep it focused, and follow the existing structure (`src/features/<feature>/` for domain code).
4. **Validate** before you open a PR:
   ```bash
   npm run typecheck
   npm run lint
   npm run build
   ```
5. **Open a pull request.** Describe what changed and why. Add screenshots for UI changes.

Ideas for where to start:

- 🐛 Check the [issues](https://github.com/yash00097/allfranchisis/issues), or open a new one for a bug you found.
- 💡 Pick an unchecked item from the [roadmap](#-scope--roadmap). Open an issue to discuss bigger features first.

### Conventions

- Server Components by default. Use `"use client"` only for interactivity.
- Mutations are Server Actions. Database and TMDB access stay server-side.
- Use Biome for linting and formatting, not ESLint or Prettier.
- In Next.js 16, middleware lives in `src/proxy.ts`. Do not add `middleware.ts`.
- `/collections` is the home page. `/` is the signed-out landing page.

## 🛰️ Error monitoring (Sentry)

Set `NEXT_PUBLIC_SENTRY_DSN` in `.env` to enable Sentry. It samples 100% of traces in development and 10% in production. To verify, run `npm run dev`, trigger an error, and check that it appears in your Sentry project.

## 🙏 Acknowledgements

<img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg" alt="TMDB logo" width="120" />

This product uses the TMDB API but is not endorsed or certified by TMDB.

---

<div align="center">

If AllFranchisis helps you keep track of a franchise, give it a ⭐ on GitHub.

</div>
