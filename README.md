# Tomodachi Life Relationship Tracker

A React + TypeScript + Vite app for tracking Miis, directed relationships, graph views, and first-pass friend-group clusters for **Tomodachi Life: Living the Dream**.

## Features

- Mii CRUD with name, personality type, and level
- Directed relationship CRUD with reciprocal pair editing and CSV-driven stage options
- Dashboard stats for Miis, relationship counts, and clusters
- Full island graph with directed edges and labels
- Mii-centered graph that only shows positive-social ties
- Cluster detection based on mutual positive-social relationships
- Async `StorageAdapter` seam so `localStorage` can be replaced later

## Relationship config

The app imports `Tomadachi_relationships/relationship_levels.csv` with Vite's `?raw` support and parses it at startup. That CSV drives:

- Valid stages per relationship type
- Stable `stageKey` values like `friends:0`
- Optional meter range metadata for display/reference
- Optional `during_fight` label metadata

## Local development

1. Install dependencies:

```bash
npm install
```

2. Start the dev server:

```bash
npm run dev
```

3. Run the test suite:

```bash
npm run test:run
```

4. Build for production:

```bash
npm run build
```

## GitHub Pages deployment

This project includes `.github/workflows/deploy.yml` for GitHub Actions Pages deployment.

1. Push the project to a GitHub repository.
2. In GitHub, open `Settings -> Pages`.
3. Set **Build and deployment** source to **GitHub Actions**.
4. Push to `main` or trigger the workflow manually.

### Base path behavior

`vite.config.ts` automatically derives the base path from:

- `VITE_BASE_PATH` if you set it explicitly
- otherwise `GITHUB_REPOSITORY`

That means project sites like `https://username.github.io/repo-name/` work out of the box.

### Deep-link refresh support

GitHub Pages is static, so direct refreshes on nested routes need help. This scaffold includes:

- `public/404.html` to redirect unknown paths back into the SPA
- a matching redirect handler in `index.html`

The included `404.html` assumes a **project repository** deployment and keeps the first path segment (`pathSegmentsToKeep = 1`). If you deploy this app as your root `username.github.io` site instead, change that value to `0`.

## Storage layer

The live app currently uses `localStorage`, but page logic only talks to the async `StorageAdapter` interface in [`src/services/storageAdapter.ts`](src/services/storageAdapter.ts).

Current methods:

- `loadIsland(): Promise<IslandData>`
- `saveIsland(data: IslandData): Promise<void>`
- optional `subscribe?(listener): () => void`

### Replacing localStorage with Firebase or Supabase later

1. Create a new adapter that implements `StorageAdapter`.
2. Load and save one shared `IslandData` snapshot in your backend.
3. Pass that adapter into `IslandProvider`.
4. Optionally implement `subscribe` for realtime updates across devices.

Because CRUD flows only call the provider API, the UI does not need to change when you swap adapters.

## Project structure

- [`src/context/IslandContext.tsx`](src/context/IslandContext.tsx): app state + CRUD actions
- [`src/services/storageAdapter.ts`](src/services/storageAdapter.ts): storage abstraction
- [`src/config/relationshipStages.ts`](src/config/relationshipStages.ts): CSV parsing + stage config
- [`src/lib/graph.tsx`](src/lib/graph.tsx): graph builders
- [`src/lib/analytics.ts`](src/lib/analytics.ts): stats and cluster detection
