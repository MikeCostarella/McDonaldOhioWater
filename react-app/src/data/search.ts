import type { WaterLocation } from "../types/account";

/**
 * Find the first location whose any account matches the query by account
 * number, street, or display name (case-insensitive substring).
 * Ported from the prototype's doSearch() loop.
 */
export function findLocation(
  locations: WaterLocation[],
  query: string,
): WaterLocation | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  for (const loc of locations) {
    for (const a of loc.accounts) {
      if (
        a.acct.toLowerCase().includes(q) ||
        a.street.toLowerCase().includes(q) ||
        a.display.toLowerCase().includes(q)
      ) {
        return loc;
      }
    }
  }
  return null;
}
