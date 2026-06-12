// Build-time jurisdiction assignment via point-in-polygon.
//
// Tests each location's lat/lon against official municipal + township polygons
// from the U.S. Census TIGERweb server (same source as the in-app boundary
// layer) and writes a `jurisdiction` field onto every location in
// public/data/locations.json.
//
// Precedence: an incorporated place (city/village) WINS over a township when a
// point falls in both, since munis are nested inside township geography in OH.
//
// Run from react-app/:  npm run assign-jurisdictions
// Re-run after any change to locations.json.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "..", "public", "data", "locations.json");

const TIGER_BASE =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer";

// Bounding box around the data coverage (Girard/Niles/Youngstown/Warren/Hubbard).
const BBOX = { xmin: -80.95, ymin: 41.0, xmax: -80.45, ymax: 41.35 };

const LAYERS = [
  { id: 4, kind: "municipality" }, // Incorporated Places (cities/villages)
  { id: 1, kind: "township" }, // County Subdivisions (townships)
];

const OUTSIDE = "Outside mapped area";

function bboxQueryUrl(layerId) {
  const p = new URLSearchParams({
    where: "1=1",
    geometry: `${BBOX.xmin},${BBOX.ymin},${BBOX.xmax},${BBOX.ymax}`,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "NAME",
    outSR: "4326",
    returnGeometry: "true",
    f: "geoJSON",
  });
  return `${TIGER_BASE}/${layerId}/query?${p.toString()}`;
}

async function fetchLayer(layerId) {
  const res = await fetch(bboxQueryUrl(layerId));
  const data = await res.json();
  // ArcGIS returns errors as 200-OK with an error body; guard on shape.
  if (!data || !Array.isArray(data.features)) {
    throw new Error(`Layer ${layerId}: unexpected response (no features array)`);
  }
  return data.features;
}

// Ray-casting point-in-polygon for a single ring (array of [lon,lat]).
function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// A GeoJSON geometry may be Polygon or MultiPolygon; honor holes (ring index >0).
function pointInGeometry(lon, lat, geom) {
  if (!geom) return false;
  const polys =
    geom.type === "Polygon" ? [geom.coordinates] :
    geom.type === "MultiPolygon" ? geom.coordinates : [];
  for (const poly of polys) {
    if (!poly.length) continue;
    if (!pointInRing(lon, lat, poly[0])) continue; // not in outer ring
    let inHole = false;
    for (let r = 1; r < poly.length; r++) {
      if (pointInRing(lon, lat, poly[r])) { inHole = true; break; }
    }
    if (!inHole) return true;
  }
  return false;
}

// Normalize TIGER NAME values. TIGER place/cousub NAMEs carry a lowercased
// type suffix (e.g. "Girard city", "Liberty township", "McDonald village").
// Strip it so municipality labels are bare ("Girard", "Youngstown") and match
// HOME_JURISDICTION, and give townships a clean "X Township" label.
function tidyName(name, kind) {
  if (!name) return OUTSIDE;
  let n = name.trim();
  if (kind === "municipality") {
    // Drop trailing " city" / " village" / " town".
    n = n.replace(/\s+(city|village|town)$/i, "");
  } else {
    // Townships: normalize the suffix casing, ensure it ends in "Township".
    n = n.replace(/\s+township$/i, " Township");
    if (!/township$/i.test(n)) n = `${n} Township`;
  }
  return n;
}

function assign(lon, lat, munis, twps) {
  for (const f of munis) {
    if (pointInGeometry(lon, lat, f.geometry)) {
      return tidyName(f.properties?.NAME, "municipality");
    }
  }
  for (const f of twps) {
    if (pointInGeometry(lon, lat, f.geometry)) {
      return tidyName(f.properties?.NAME, "township");
    }
  }
  return OUTSIDE;
}

async function main() {
  console.log("Fetching boundary layers from TIGERweb…");
  const munis = await fetchLayer(4);
  const twps = await fetchLayer(1);
  console.log(`  municipalities: ${munis.length} features`);
  console.log(`  townships:      ${twps.length} features`);

  const locs = JSON.parse(await readFile(DATA_PATH, "utf8"));
  console.log(`Assigning jurisdictions to ${locs.length} locations…`);

  const counts = {};
  for (const loc of locs) {
    const j = assign(Number(loc.lon), Number(loc.lat), munis, twps);
    loc.jurisdiction = j;
    counts[j] = (counts[j] || 0) + 1;
  }

  await writeFile(DATA_PATH, JSON.stringify(locs), "utf8");

  console.log("\nLocations per jurisdiction:");
  for (const [j, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${j.padEnd(24)} ${n}`);
  }
  const home = counts["McDonald"] || 0;
  const outside = locs.length - home;
  console.log(`\n${outside} of ${locs.length} locations are OUTSIDE McDonald city limits.`);
  console.log("Wrote jurisdiction field to public/data/locations.json");
}

main().catch((e) => {
  console.error("assign-jurisdictions failed:", e.message);
  process.exit(1);
});
