# McDonaldOhioWater

Interactive map of McDonald, Ohio municipal water-service accounts. React 18 +
TypeScript + Vite, deployed to GitHub Pages, installable as a PWA (Phase 5).

Migrated from a single-file Leaflet prototype (preserved in `../PrototypeHTML/`)
following the HTML-to-React-PWA-Migration-Playbook.

## Data

1,775 locations / 1,780 accounts across McDonald and neighboring jurisdictions.
The dataset ships as `public/data/locations.json` and is fetched at runtime
through the single data seam in `src/data/loadLocations.ts`.

## Develop

    cd react-app
    npm install
    npm run dev      # test locally before committing

    npm run typecheck
    npm run build

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds
`react-app/` and publishes `dist/` to GitHub Pages at
https://mikecostarella.github.io/McDonaldOhioWater/
