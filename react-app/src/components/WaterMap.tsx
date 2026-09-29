import { useMemo } from "react";
import { MapContainer } from "react-leaflet";
import BaseMapLayers from "../vendor/basemaps/BaseMapLayers";
import type { BaseMapId, TileSpec } from "../vendor/basemaps/basemaps";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { InvalidateSize } from "../hooks/useInvalidateSize";
import { MapController } from "../hooks/useMapController";
import AccountMarkers from "./AccountMarkers";
import GeolocationControl from "./GeolocationControl";
import BoundaryLayers from "./BoundaryLayers";
import type { WaterLocation } from "../types/account";

// Streets stays the OpenStreetMap tiles the app has always used; the aerial
// choices come from vendor/basemaps.
const OSM_STREETS: TileSpec = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxNativeZoom: 19,
};

// Map defaults ported verbatim from the prototype's L.map(...) init.
export const MAP_CENTER: [number, number] = [41.15972472901409, -80.72895425690142];
export const MAP_ZOOM = 14;

/** [[minLat, minLon], [maxLat, maxLon]] — the bounding box of all locations. */
export type DataBounds = [[number, number], [number, number]];

interface WaterMapProps {
  /** Base map choice (streets / aerial / hybrid) from useBaseMap(). */
  baseMap?: BaseMapId;
  locations: WaterLocation[];
  onSelect?: (loc: WaterLocation) => void;
  onMapReady?: (map: LeafletMap) => void;
  boundaryVisible: { municipalities: boolean; townships: boolean };
  selectedJurisdictions?: Set<string>;
  selectedStreets?: Set<string>;
}

/**
 * Base map + account markers + geolocation + boundary outlines. Exposes the
 * Leaflet instance via onMapReady so search can flyTo. Center/zoom/tiles match
 * the prototype.
 */
export default function WaterMap({
  baseMap = "streets",
  locations,
  onSelect,
  onMapReady,
  boundaryVisible,
  selectedJurisdictions,
  selectedStreets,
}: WaterMapProps) {
  // Bounding box of every service location, handed to the geolocation control
  // so it can frame the whole McDonald service area when the user is outside it.
  const dataBounds = useMemo<DataBounds | null>(() => {
    if (!locations.length) return null;
    let minLat = Infinity,
      minLon = Infinity,
      maxLat = -Infinity,
      maxLon = -Infinity;
    for (const l of locations) {
      if (l.lat < minLat) minLat = l.lat;
      if (l.lat > maxLat) maxLat = l.lat;
      if (l.lon < minLon) minLon = l.lon;
      if (l.lon > maxLon) maxLon = l.lon;
    }
    return [
      [minLat, minLon],
      [maxLat, maxLon],
    ];
  }, [locations]);

  return (
    <MapContainer
      center={MAP_CENTER}
      zoom={MAP_ZOOM}
      zoomControl={true}
      style={{ width: "100%", height: "100%" }}
    >
      {/* OSM streets, or OSIP aerial (+ CARTO labels for hybrid); see
          vendor/basemaps. Moves maxZoom with the choice (aerial to 21). */}
      <BaseMapLayers baseMap={baseMap} streets={OSM_STREETS} streetsLabels={null} />
      <BoundaryLayers visible={boundaryVisible} />
      <AccountMarkers
        locations={locations}
        onSelect={onSelect}
        selectedJurisdictions={selectedJurisdictions}
        selectedStreets={selectedStreets}
      />
      <GeolocationControl dataBounds={dataBounds} />
      <InvalidateSize />
      {onMapReady && <MapController onReady={onMapReady} />}
    </MapContainer>
  );
}
