import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { WaterLocation } from "./types/account";
import { HOME_JURISDICTION } from "./types/account";
import {
  loadLocations,
  countAccounts,
  countOutsideAccounts,
  jurisdictionCounts,
  streetCounts,
} from "./data/loadLocations";
import { findLocation } from "./data/search";
import { filterLocations } from "./data/filterLocations";
import WaterMap, { MAP_CENTER, MAP_ZOOM } from "./components/WaterMap";
import AccountDialog from "./components/AccountDialog";
import AccountTable from "./components/AccountTable";
import MultiSelectFilter from "./components/MultiSelectFilter";
import MainMenu from "./components/MainMenu";
import type { AppView } from "./components/MainMenu";
import Legend from "./components/Legend";
import BuildStamp from "./components/BuildStamp";
import HelpDialog from "./components/HelpDialog";

/**
 * Phase 3 in progress. Base map + markers + click dialog + search are live;
 * the legend lands in the next slice.
 */
export default function App() {
  const [locations, setLocations] = useState<WaterLocation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<WaterLocation | null>(null);
  const [query, setQuery] = useState("");
  const [noResult, setNoResult] = useState(false);
  const [boundaryVisible, setBoundaryVisible] = useState({
    municipalities: false,
    townships: false,
  });
  const [selectedJur, setSelectedJur] = useState<Set<string> | null>(null);
  const [selectedStreets, setSelectedStreets] = useState<Set<string> | null>(
    null,
  );
  const [helpOpen, setHelpOpen] = useState(false);
  const [view, setView] = useState<AppView>("map");
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    loadLocations()
      .then(setLocations)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const onMapReady = useCallback((map: LeafletMap) => {
    mapRef.current = map;
  }, []);

  const doSearch = useCallback(() => {
    setNoResult(false);
    const found = findLocation(locations ?? [], query);
    if (found && mapRef.current) {
      mapRef.current.flyTo([found.lat, found.lon], 17, { animate: true, duration: 1 });
      window.setTimeout(() => setSelected(found), 800);
    } else if (query.trim()) {
      setNoResult(true);
    }
  }, [locations, query]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setNoResult(false);
    mapRef.current?.flyTo(MAP_CENTER, MAP_ZOOM, { animate: true });
  }, []);

  const toggleBoundary = useCallback((id: "municipalities" | "townships") => {
    setBoundaryVisible((v) => ({ ...v, [id]: !v[id] }));
  }, []);

  const locCount = locations?.length ?? 0;
  const acctCount = locations ? countAccounts(locations) : 0;
  const outsideCount = locations
    ? countOutsideAccounts(locations, HOME_JURISDICTION)
    : 0;
  const hasJurisdictions = !!locations?.some((l) => l.jurisdiction);
  const hasStreets = !!locations?.some((l) => l.streetName);

  // Jurisdiction list + counts for the filter dropdown (recomputed only on data change).
  const jurOptions = useMemo(
    () => (locations ? jurisdictionCounts(locations) : []),
    [locations],
  );

  // Street list + counts for the filter dropdown.
  const streetOptions = useMemo(
    () => (locations ? streetCounts(locations) : []),
    [locations],
  );

  // Default to all jurisdictions selected once data has loaded.
  useEffect(() => {
    if (jurOptions.length && selectedJur === null) {
      setSelectedJur(new Set(jurOptions.map((o) => o.name)));
    }
  }, [jurOptions, selectedJur]);

  // Default to all streets selected once data has loaded.
  useEffect(() => {
    if (streetOptions.length && selectedStreets === null) {
      setSelectedStreets(new Set(streetOptions.map((o) => o.name)));
    }
  }, [streetOptions, selectedStreets]);

  // The active filter selections, shared by the map and the list so both show
  // exactly the same set.
  const activeJur = hasJurisdictions ? selectedJur ?? undefined : undefined;
  const activeStreets = hasStreets ? selectedStreets ?? undefined : undefined;

  // The filtered locations the list view renders (single source of truth shared
  // with the map via filterLocations).
  const filtered = useMemo(
    () => filterLocations(locations ?? [], activeJur, activeStreets),
    [locations, activeJur, activeStreets],
  );

  // The map lives inside a hidden container while the list is showing. Leaflet
  // measures 0×0 in a display:none parent, so re-measure when we return to it.
  useEffect(() => {
    if (view === "map" && mapRef.current) {
      const id = window.setTimeout(() => mapRef.current?.invalidateSize(), 0);
      return () => window.clearTimeout(id);
    }
  }, [view]);

  return (
    <>
      <div id="header">
        <div className="header-left">
          <MainMenu view={view} onViewChange={setView} />
          <div className="title-block">
            <h1>&#128204; McDonald Ohio Water Accounts Map</h1>
            <p>Interactive mapping of municipal water service accounts</p>
          </div>
        </div>
        <div className="meta">
          <button
            id="help-btn"
            type="button"
            aria-label="Help"
            title="Help"
            onClick={() => setHelpOpen(true)}
          >
            ?
          </button>
          <span className="meta-credit">
            <span>Created by:</span> Mike Costarella
          </span>
        </div>
      </div>

      <div id="stats-bar">
        {error ? (
          <div className="stat">
            <span style={{ color: "#F44336" }}>Error: {error}</span>
          </div>
        ) : (
          <>
            <div className="stat">
              Total Locations: <b>{locCount.toLocaleString()}</b>
            </div>
            <div className="stat">
              Total Accounts: <b>{acctCount.toLocaleString()}</b>
            </div>
            {hasJurisdictions && (
              <div className="stat">
                <span className="label-full">Outside McDonald limits:</span>
                <span className="label-short">Outside McDonald:</span>{" "}
                <b style={{ color: "#E040FB" }}>
                  {outsideCount.toLocaleString()}
                </b>
              </div>
            )}
          </>
        )}
      </div>

      <div id="search-bar">
        <input
          type="text"
          value={query}
          placeholder="Search by account # or address..."
          onChange={(e) => {
            setQuery(e.target.value);
            setNoResult(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") doSearch();
          }}
        />
        <button onClick={doSearch}>&#128269; Search</button>
        <button className="clear" onClick={clearSearch}>
          Clear
        </button>
        {noResult && <span className="search-msg">No accounts found matching: {query}</span>}
        {hasJurisdictions && selectedJur && (
          <MultiSelectFilter
            label="Jurisdiction"
            noun="jurisdictions"
            options={jurOptions}
            selected={selectedJur}
            onChange={setSelectedJur}
          />
        )}
        {hasStreets && selectedStreets && (
          <MultiSelectFilter
            label="Street"
            noun="streets"
            options={streetOptions}
            selected={selectedStreets}
            onChange={setSelectedStreets}
            searchable
          />
        )}
      </div>

      <div id="map-wrap" className={view === "list" ? "hidden" : undefined}>
        <WaterMap
          locations={locations ?? []}
          onSelect={setSelected}
          onMapReady={onMapReady}
          boundaryVisible={boundaryVisible}
          selectedJurisdictions={activeJur}
          selectedStreets={activeStreets}
        />
        <Legend boundaryVisible={boundaryVisible} onToggleBoundary={toggleBoundary} />
      </div>

      {view === "list" && (
        <AccountTable
          locations={filtered}
          query={query}
          onSelect={setSelected}
        />
      )}

      <AccountDialog location={selected} onClose={() => setSelected(null)} />

      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />

      <BuildStamp />
    </>
  );
}
