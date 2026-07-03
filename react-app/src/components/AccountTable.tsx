import { useMemo, useState } from "react";
import type { WaterLocation } from "../types/account";
import { HOME_JURISDICTION } from "../types/account";

interface AccountTableProps {
  /** Already filtered by jurisdiction/street (same set the map shows). */
  locations: WaterLocation[];
  /** Free-text search; filters rows by account # or address (case-insensitive). */
  query?: string;
  /** Open the detail dialog for the clicked account's location. */
  onSelect: (loc: WaterLocation) => void;
}

type SortKey =
  | "acct"
  | "address"
  | "city"
  | "state"
  | "zip"
  | "jurisdiction"
  | "lat"
  | "lon";

interface Column {
  key: SortKey;
  label: string;
  numeric?: boolean;
}

const COLUMNS: Column[] = [
  { key: "acct", label: "Account #" },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "zip", label: "Zip" },
  { key: "jurisdiction", label: "Jurisdiction" },
  { key: "lat", label: "Latitude", numeric: true },
  { key: "lon", label: "Longitude", numeric: true },
];

/** Cap rendered rows for performance; tighten filters to drill in. */
const ROW_CAP = 500;

interface Row {
  acct: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  jurisdiction: string;
  lat: number;
  lon: number;
  outside: boolean;
  loc: WaterLocation;
}

/**
 * Flat, sortable table of the filtered accounts — one row per account (so
 * multi-account locations show each account). Click a column header to sort
 * (click again to reverse); click a row to open that location's detail dialog,
 * exactly as clicking its marker does. Renders the first 500 rows and shows a
 * note when more match, so narrowing the jurisdiction/street filters drills in.
 */
export default function AccountTable({
  locations,
  query = "",
  onSelect,
}: AccountTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("acct");
  const [asc, setAsc] = useState(true);

  // Flatten locations -> one row per account.
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    for (const loc of locations) {
      const jurisdiction = loc.jurisdiction ?? "Unassigned";
      const outside =
        !!loc.jurisdiction && loc.jurisdiction !== HOME_JURISDICTION;
      for (const a of loc.accounts) {
        out.push({
          acct: a.acct,
          address: a.street,
          city: a.city,
          state: a.state,
          zip: a.zip,
          jurisdiction,
          lat: a.lat,
          lon: a.lon,
          outside,
          loc,
        });
      }
    }
    return out;
  }, [locations]);

  // Free-text filter by account # or address (case-insensitive substring).
  const matched = useMemo<Row[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.acct.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q),
    );
  }, [rows, query]);

  const sorted = useMemo<Row[]>(() => {
    const col = COLUMNS.find((c) => c.key === sortKey);
    const numeric = !!col?.numeric;
    const dir = asc ? 1 : -1;
    return [...matched].sort((x, y) => {
      const a = x[sortKey];
      const b = y[sortKey];
      if (numeric) return ((a as number) - (b as number)) * dir;
      return String(a).localeCompare(String(b)) * dir;
    });
  }, [matched, sortKey, asc]);

  const shown = sorted.slice(0, ROW_CAP);
  const total = matched.length;

  const onHeaderClick = (key: SortKey) => {
    if (key === sortKey) {
      setAsc((v) => !v);
    } else {
      setSortKey(key);
      setAsc(true);
    }
  };

  return (
    <div id="account-table-wrap">
      <div className="table-caption">
        {total === 0 ? (
          "No accounts match the current filters."
        ) : total > ROW_CAP ? (
          <>
            Showing first {ROW_CAP.toLocaleString()} of{" "}
            {total.toLocaleString()} accounts — narrow the filters to see more.
          </>
        ) : (
          <>
            {total.toLocaleString()} account{total === 1 ? "" : "s"}
          </>
        )}
      </div>

      <div className="table-scroll">
        <table id="account-table">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`${col.numeric ? "num" : ""}${
                    sortKey === col.key ? " sorted" : ""
                  }`}
                  onClick={() => onHeaderClick(col.key)}
                  aria-sort={
                    sortKey === col.key
                      ? asc
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  {col.label}
                  <span className="sort-caret">
                    {sortKey === col.key ? (asc ? " ▲" : " ▼") : ""}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr
                key={`${r.acct}-${i}`}
                className={r.outside ? "outside" : ""}
                onClick={() => onSelect(r.loc)}
              >
                <td>{r.acct}</td>
                <td>{r.address}</td>
                <td>{r.city}</td>
                <td>{r.state}</td>
                <td>{r.zip}</td>
                <td>{r.jurisdiction}</td>
                <td className="num">{r.lat.toFixed(6)}</td>
                <td className="num">{r.lon.toFixed(6)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
