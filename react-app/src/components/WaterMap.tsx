import { useMemo } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { InvalidateSize } from "../hooks/useInvalidateSize";
import { MapController } from "../hooks/useMapController";
import AccountMarkers from "./AccountMarkers";
import GeolocationControl from "./GeolocationControl";
import BoundaryLayers from "./BoundaryLayers";
import type { WaterLocation } from "../types/account";

// Map defaults ported verbatim from the prototype's L.map(...) init.
export const MAP_CENTER: [number, number] = [41.15972472901409, -80.72895425690142];
export const MAP_ZOOM = 14;

/** [[minLat, minLon], [maxLat, maxLon]] — the bounding box of all locations. */
export type DataBounds = [[number, number], [number, number]];

interface WaterMapProps {
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
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />
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
