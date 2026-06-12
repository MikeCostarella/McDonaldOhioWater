// Assigns canonical street names (from the source spreadsheet's StreetName
// column) to each account and location in public/data/locations.json.
//
// The spreadsheet is the authority for street names: it has a dedicated,
// consistently-formatted StreetName column (no house numbers), joined to the
// JSON by AccountNumber === account.acct (verified 1:1).
//
// Each account gets a `streetName`; each location gets a `streetName` (its
// primary/most-common street) and `streetNames` (all distinct streets at that
// point — usually one, but ~18 corner locations have two). The filter matches
// any of a location's streets so nothing is hidden.
//
// Run from react-app/:  npm run assign-streets
// Requires the xlsx path passed as arg or placed at ../Data/<file>.xlsx.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import xlsx from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LOCATIONS = path.join(ROOT, "public", "data", "locations.json");

// Resolve the spreadsheet: CLI arg wins; else the known name in ../Data; else,
// if that exact name isn't there, the single .xlsx in ../Data (so the script
// survives renames and space/underscore differences in the export filename).
const argPath = process.argv[2];
const DATA_DIR = path.resolve(ROOT, "..", "Data");
const DEFAULT_XLSX = path.join(DATA_DIR, "McDonald Ohio - Water Accounts - 003.xlsx");

function resolveXlsx() {
  if (argPath) return path.resolve(argPath);
  if (fs.existsSync(DEFAULT_XLSX)) return DEFAULT_XLSX;
  try {
    const xlsxFiles = fs
      .readdirSync(DATA_DIR)
      .filter((f) => f.toLowerCase().endsWith(".xlsx") && !f.startsWith("~$"));
    if (xlsxFiles.length === 1) return path.join(DATA_DIR, xlsxFiles[0]);
  } catch {
    /* DATA_DIR missing; fall through to the not-found error below. */
  }
  return DEFAULT_XLSX;
}
const XLSX_PATH = resolveXlsx();

if (!fs.existsSync(XLSX_PATH)) {
  console.error(`Spreadsheet not found: ${XLSX_PATH}`);
  console.error(
    'Pass the path as an argument, e.g.: npm run assign-streets -- "../Data/McDonald Ohio - Water Accounts - 003.xlsx"',
  );
  process.exit(1);
}

console.log(`Reading street names from: ${XLSX_PATH}`);
const wb = xlsx.readFile(XLSX_PATH);
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

// Build AccountNumber -> StreetName (trimmed).
const acctToStreet = new Map();
for (const r of rows) {
  const acct = String(r["Service Line ID"] ?? "").trim();
  const street = String(r["Street Name"] ?? "").trim();
  if (acct) acctToStreet.set(acct, street);
}
console.log(`Loaded ${acctToStreet.size} account → street mappings.`);

const locations = JSON.parse(fs.readFileSync(LOCATIONS, "utf8"));

let assigned = 0;
let missing = 0;
let mixed = 0;

for (const loc of locations) {
  const counts = new Map(); // street -> # accounts at this location
  for (const a of loc.accounts) {
    const s = acctToStreet.get(String(a.acct).trim()) ?? "";
    a.streetName = s;
    if (s) {
      counts.set(s, (counts.get(s) ?? 0) + 1);
      assigned++;
    } else {
      missing++;
    }
  }
  const distinct = [...counts.keys()];
  if (distinct.length > 1) mixed++;
  // primary = most common street at this location
  let primary = "";
  let best = -1;
  for (const [s, n] of counts) {
    if (n > best) {
      best = n;
      primary = s;
    }
  }
  loc.streetName = primary;
  loc.streetNames = distinct;
}

fs.writeFileSync(LOCATIONS, JSON.stringify(locations));

// Report distinct streets by location count.
const byStreet = new Map();
for (const loc of locations) {
  for (const s of loc.streetNames.length ? loc.streetNames : [""]) {
    byStreet.set(s || "Unknown", (byStreet.get(s || "Unknown") ?? 0) + 1);
  }
}
const sorted = [...byStreet.entries()].sort((a, b) => b[1] - a[1]);

console.log(`\nAssigned street to ${assigned} accounts (${missing} missing).`);
console.log(`Locations with >1 street: ${mixed}`);
console.log(`Distinct street names: ${sorted.length}`);
console.log("\nTop 15 streets by location count:");
for (const [s, n] of sorted.slice(0, 15)) {
  console.log(`  ${String(n).padStart(4)}  ${s}`);
}
console.log(`\nWrote ${LOCATIONS}`);
