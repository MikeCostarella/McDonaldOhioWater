import { memo } from "react";
import { CircleMarker, Tooltip } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { WaterLocation } from "../types/account";
import { HOME_JURISDICTION } from "../types/account";
import { colorForCount, radiusForCount } from "../data/markerStyle";
import { tooltipHtml } from "../data/tooltip";

interface AccountMarkersProps {
  locations?: WaterLocation[];
  onSelect?: (loc: WaterLocation) => void;
  /**
   * Set of jurisdiction names to show. If undefined, jurisdiction is not
   * filtered.
   */
  selectedJurisdictions?: Set<string>;
  /**
   * Set of street names to show. If undefined, street is not filtered. A
   * location matches if ANY of its street names is selected.
   */
  selectedStreets?: Set<string>;
}

function isOutside(loc: WaterLocation): boolean {
  return !!loc.jurisdiction && loc.jurisdiction !== HOME_JURISDICTION;
}

/** Street names for a location (handles the ~18 corner locations with two). */
function streetsOf(loc: WaterLocation): string[] {
  if (loc.streetNames && loc.streetNames.length) return loc.streetNames;
  return [loc.streetName ?? "Unknown"];
}

/**
 * One CircleMarker per location, colored + sized by account count, grouped into
 * a MarkerClusterGroup. Out-of-city locations get a magenta ring. Locations are
 * filtered by jurisdiction and/or street when those selections are supplied
 * (both applied together — AND).
 *
 * Wrapped in React.memo: rebuilding ~5,568 markers + the cluster tree is
 * expensive, so this must NOT re-render when unrelated app state (e.g. the
 * selected-location dialog) changes.
 */
function AccountMarkers({
  locations = [],
  onSelect,
  selectedJurisdictions,
  selectedStreets,
}: AccountMarkersProps) {
  const shown = locations.filter((loc) => {
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

  return (
    <MarkerClusterGroup
      chunkedLoading
      maxClusterRadius={50}
      spiderfyOnMaxZoom
      showCoverageOnHover={false}
      disableClusteringAtZoom={17}
    >
      {shown.map((loc, i) => {
        const count = loc.accounts.length;
        const outside = isOutside(loc);
        return (
          <CircleMarker
            key={`${loc.lat},${loc.lon},${i}`}
            center={[loc.lat, loc.lon]}
            radius={radiusForCount(count)}
            pathOptions={{
              fillColor: colorForCount(count),
              color: outside ? "#E040FB" : "rgba(255,255,255,0.6)",
              weight: outside ? 2.5 : 1.5,
              opacity: 1,
              fillOpacity: 0.85,
            }}
            eventHandlers={onSelect ? { click: () => onSelect(loc) } : undefined}
          >
            <Tooltip sticky offset={[12, 0]}>
              <span dangerouslySetInnerHTML={{ __html: tooltipHtml(loc) }} />
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MarkerClusterGroup>
  );
}

export default memo(AccountMarkers);
