# McDonald Ohio Water Accounts Map

Interactive map of Village of McDonald, Ohio municipal water service accounts — **1,780 accounts across 1,775 service locations** — built as a civic data tool for exploring where the village's water system actually serves.

**Live site:** https://mikecostarella.github.io/McDonaldOhioWater/

## The civic finding

McDonald's water system reaches well beyond the village limits. A point-in-polygon analysis of every service location against Census TIGERweb boundaries shows:

| Jurisdiction | Locations |
|---|---|
| McDonald | 1,331 |
| Weathersfield Township | 440 |
| Girard | 2 |
| Youngstown | 1 |
| Warren | 1 |

**444 locations (~25%) — totaling 445 accounts — sit outside McDonald village limits**, almost entirely in surrounding Weathersfield Township. Out-of-village locations are highlighted on the map with a magenta ring.

## Features

- **Density markers** — one circle per location, colored and sized by account count, clustered at lower zooms (clustering disables at zoom 17)
- **Search** — by account number or street address, flying to and opening the matched location
- **Jurisdiction filter** — multi-select dropdown with per-jurisdiction location counts
- **Street filter** — multi-select dropdown over 76 canonical street names, with an in-panel search box; combines with the jurisdiction filter (AND)
- **Account details** — click any marker for its accounts, with Google Maps and Directions links
- **Geolocation** — a pulsing "you are here" marker; clicking it opens a dialog showing accuracy, coordinates, and the jurisdiction you're standing in (computed live by point-in-polygon)
- **Boundary overlays** — municipal (dashed amber) and township (solid blue-gray) outlines, toggled from the legend
- **PWA** — installable, with cached map tiles and app shell for offline use; footer shows the deploy timestamp
- **Mobile responsive** — controls wrap below 640px, the legend starts collapsed, and dialogs/dropdowns stay within the viewport

## Tech stack

React 18 · TypeScript · Vite · react-leaflet 4.2.1 (Leaflet 1.9.4) · react-leaflet-cluster · vite-plugin-pwa · OpenStreetMap tiles · deployed to GitHub Pages via GitHub Actions.

Boundary geometry comes from the Census Bureau's TIGERweb ArcGIS services (Incorporated Places layer 4, County Subdivisions layer 1), fetched at runtime for overlays and at build time for jurisdiction assignment.

## Repository layout

```
McDonaldOhioWater/
├── react-app/          The application (Vite project)
│   ├── public/data/locations.json   Geocoded locations + accounts (the dataset the app loads)
│   ├── scripts/        Build-time data pipeline (see below)
│   └── src/            Components, data helpers, styles
├── Data/               Source spreadsheets (account exports)
└── PrototypeHTML/      The original single-file Leaflet prototype this app was migrated from
```

## Local development

```
cd react-app
npm install
npm run dev
```

Open http://localhost:5173/McDonaldOhioWater/ — the base path matches the GitHub Pages deployment. Pushing to `main` triggers the GitHub Actions workflow, which builds and deploys to Pages (about two minutes). The site is a PWA, so hard-refresh (Ctrl+Shift+R) after a deploy to bypass the service worker cache.

## Data pipeline

`public/data/locations.json` is the dataset the app loads: geocoded locations, each carrying its accounts plus two derived fields. Two scripts (run from `react-app/`) regenerate the derived fields when the source data changes:

- **`npm run assign-jurisdictions`** — fetches municipal and township polygons from TIGERweb and ray-casts every location to assign its `jurisdiction` (municipality wins where they overlap). Prints a per-jurisdiction tally.
- **`npm run assign-streets`** — joins each account to the source spreadsheet's `Street Name` column (by `Service Line ID`) and writes canonical street names onto accounts and locations. By default it uses the spreadsheet in `../Data/`, falling back to the single `.xlsx` there if the name differs; or pass a path: `npm run assign-streets -- "..\Data\McDonald Ohio - Water Accounts - 003.xlsx"`.

Both scripts are idempotent and only add or update their own fields, so they can be run in either order or re-run safely. After a data refresh, verify locally (`npm run dev`) before committing the updated `locations.json`.

## Attribution

Map tiles © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors. Boundary data from the U.S. Census Bureau TIGERweb services. Account data provided by the Village of McDonald.

---

*Created by Mike Costarella · [mikecostarella.github.io](https://mikecostarella.github.io)*
