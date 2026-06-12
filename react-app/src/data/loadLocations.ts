import type { WaterLocation } from "../types/account";

/**
 * The single data seam for the app. Everything consumes WaterLocation[] from
 * here; this is the only place that knows the data is a static JSON file. To
 * swap in a real backend later, change only this function.
 *
 * The JSON ships in public/data and is fetched at runtime (it is ~1.4 MB, so
 * we deliberately keep it out of the JS bundle).
 */
export async function loadLocations(): Promise<WaterLocation[]> {
  // import.meta.env.BASE_URL resolves to the Vite `base` ("/GirardOhioWater/"),
  // so the fetch path is correct on GitHub Pages and in local dev alike.
  const url = `${import.meta.env.BASE_URL}data/locations.json`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load locations (${res.status} ${res.statusText})`);
  }

  const raw = (await res.json()) as WaterLocation[];

  // The source data is already typed correctly (booleans/enums not needed here),
  // so normalization is light: guard the shape and coerce coordinates to numbers.
  if (!Array.isArray(raw)) {
    throw new Error("locations.json did not contain an array");
  }

  return raw.map((loc) => ({
    lat: Number(loc.lat),
    lon: Number(loc.lon),
    jurisdiction: loc.jurisdiction,
    streetName: loc.streetName,
    streetNames: loc.streetNames,
    accounts: loc.accounts.map((a) => ({
      ...a,
      lat: Number(a.lat),
      lon: Number(a.lon),
    })),
  }));
}

/** Total number of individual accounts across all locations. */
export function countAccounts(locations: WaterLocation[]): number {
  return locations.reduce((sum, loc) => sum + loc.accounts.length, 0);
}

/**
 * Count of accounts whose location is OUTSIDE the home jurisdiction (Girard) —
 * i.e. Girard water service extended beyond city limits. Locations without a
 * jurisdiction (script not yet run) are not counted as outside.
 */
export function countOutsideAccounts(
  locations: WaterLocation[],
  home: string,
): number {
  return locations.reduce(
    (sum, loc) =>
      loc.jurisdiction && loc.jurisdiction !== home
        ? sum + loc.accounts.length
        : sum,
    0,
  );
}

/**
 * Distinct jurisdictions present in the data with their LOCATION counts,
 * sorted by count descending. Drives the jurisdiction filter dropdown.
 * Locations missing a jurisdiction are bucketed under "Unassigned".
 */
export interface NamedCount {
  name: string;
  count: number;
}

/** @deprecated alias kept for existing imports; use NamedCount. */
export type JurisdictionCount = NamedCount;

export function jurisdictionCounts(
  locations: WaterLocation[],
): NamedCount[] {
  const m = new Map<string, number>();
  for (const loc of locations) {
    const j = loc.jurisdiction ?? "Unassigned";
    m.set(j, (m.get(j) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Distinct street names with their LOCATION counts, sorted alphabetically by
 * name. Drives the street filter dropdown. A location is counted under each of
 * its street names (corner locations have two); locations missing a street are
 * bucketed under "Unknown".
 */
export function streetCounts(locations: WaterLocation[]): NamedCount[] {
  const m = new Map<string, number>();
  for (const loc of locations) {
    const names =
      loc.streetNames && loc.streetNames.length
        ? loc.streetNames
        : [loc.streetName ?? "Unknown"];
    for (const s of names) {
      const key = s || "Unknown";
      m.set(key, (m.get(key) ?? 0) + 1);
    }
  }
  return [...m.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
