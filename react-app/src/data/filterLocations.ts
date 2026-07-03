import type { WaterLocation } from "../types/account";

/**
 * Street names for a location (handles corner locations that sit on two
 * streets). A location matches the street filter if ANY of these is selected.
 */
export function streetsOf(loc: WaterLocation): string[] {
  if (loc.streetNames && loc.streetNames.length) return loc.streetNames;
  return [loc.streetName ?? "Unknown"];
}

/**
 * The single source of truth for which locations are visible given the active
 * jurisdiction and street selections. Both the map (AccountMarkers) and the
 * list view (AccountTable) call this, so the two can never disagree about what
 * the current filters show.
 *
 * - `selectedJurisdictions`: if provided, a location is kept only when its
 *   jurisdiction (or "Unassigned" when missing) is in the set.
 * - `selectedStreets`: if provided, a location is kept only when at least one
 *   of its street names is in the set.
 *
 * When a selection is undefined that dimension is not filtered. Both are
 * applied together (AND).
 */
export function filterLocations(
  locations: WaterLocation[],
  selectedJurisdictions?: Set<string>,
  selectedStreets?: Set<string>,
): WaterLocation[] {
  return locations.filter((loc) => {
    if (
      selectedJurisdictions &&
      !selectedJurisdictions.has(loc.jurisdiction ?? "Unassigned")
    ) {
      return false;
    }
    if (
      selectedStreets &&
      !streetsOf(loc).some((s) => selectedStreets.has(s))
    ) {
      return false;
    }
    return true;
  });
}
