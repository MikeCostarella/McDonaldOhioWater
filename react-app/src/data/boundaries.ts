import type { FeatureCollection } from "geojson";

/**
 * Boundary layers fetched live from the U.S. Census TIGERweb ArcGIS server.
 * One source covers both Trumbull (Girard, Niles, Warren, Hubbard) and
 * Mahoning (Youngstown) counties, since the data spans the county line.
 *
 * Layer 4 = Incorporated Places (cities/villages); Layer 1 = County
 * Subdivisions (townships). Both expose a NAME field and geoJSON output.
 */
const TIGER_BASE =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer";

export interface BoundaryLayerDef {
  id: "municipalities" | "townships";
  label: string;
  layerId: number;
  /** Stroke color for the outline. */
  color: string;
  dashArray?: string;
}

export const BOUNDARY_LAYERS: BoundaryLayerDef[] = [
  { id: "municipalities", label: "Municipalities", layerId: 4, color: "#FF8F00", dashArray: "8,5" },
  { id: "townships", label: "Townships", layerId: 1, color: "#607d8b" },
];

// Bounding box around the data's coverage area (Girard/Niles/Youngstown/
// Warren/Hubbard), in WGS84. Keeps the query from returning all of Ohio.
const AREA_BBOX = { xmin: -80.95, ymin: 41.0, xmax: -80.45, ymax: 41.35 };

/**
 * Fetch one boundary layer as GeoJSON, filtered to the map area.
 *
 * IMPORTANT: ArcGIS returns query errors as HTTP 200 with an error body, so
 * `response.ok` is not a sufficient guard — we check `data.features` shape.
 * Returns null on any failure (caller treats null as "show nothing").
 */
export async function fetchBoundary(
  def: BoundaryLayerDef,
): Promise<FeatureCollection | null> {
  const params = new URLSearchParams({
    where: "1=1",
    geometry: `${AREA_BBOX.xmin},${AREA_BBOX.ymin},${AREA_BBOX.xmax},${AREA_BBOX.ymax}`,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "NAME",
    outSR: "4326",
    returnGeometry: "true",
    f: "geoJSON",
  });
  const url = `${TIGER_BASE}/${def.layerId}/query?${params.toString()}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    // Guard on payload shape, not res.ok (200-OK-with-error-body pattern).
    if (!data || !Array.isArray(data.features)) return null;
    return data as FeatureCollection;
  } catch {
    return null;
  }
}
