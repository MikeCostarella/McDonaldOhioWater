// Domain types for the Girard Ohio Water Accounts map.
// Captured verbatim from the prototype's LOCATIONS data shape.

/** A single water-service account at a location. */
export interface WaterAccount {
  /** Account number, e.g. "04313-001". */
  acct: string;
  street: string;
  city: string;
  /** Two-letter state code, e.g. "OH". */
  state: string;
  zip: string;
  lat: number;
  lon: number;
  /**
   * Parcel ID. Almost always empty in the source data (2 of ~6,000),
   * but when present it drives the Trumbull County Auditor link.
   */
  parcel: string;
  /** Account status. Uniformly "Active" in the current dataset. */
  status: string;
  /** Prebuilt display label, e.g. "04313-001 (CLARK, ALISSA)". */
  display: string;
  /**
   * Canonical street name (no house number) from the source spreadsheet's
   * StreetName column, assigned at build time by scripts/assign-streets.mjs.
   */
  streetName?: string;
}

/**
 * A map location (a single lat/lon point) holding one or more accounts.
 * Multiple accounts share a point for multi-unit addresses (apartments, etc.).
 */
export interface WaterLocation {
  lat: number;
  lon: number;
  accounts: WaterAccount[];
  /**
   * Jurisdiction the location physically sits in (e.g. "Girard",
   * "Liberty Township", "Youngstown"), assigned at build time by
   * scripts/assign-jurisdictions.mjs via point-in-polygon. May be undefined
   * if the assignment script hasn't been run.
   */
  jurisdiction?: string;
  /**
   * Primary (most-common) canonical street name at this location, from the
   * source spreadsheet via scripts/assign-streets.mjs.
   */
  streetName?: string;
  /**
   * All distinct street names at this location. Usually one; ~18 corner
   * locations have two. The street filter matches any of these.
   */
  streetNames?: string[];
}

/** The home jurisdiction; accounts outside it are Girard serving beyond its limits. */
export const HOME_JURISDICTION = "McDonald";
