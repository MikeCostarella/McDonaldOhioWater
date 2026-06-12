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
      <GeolocationControl />
      <InvalidateSize />
      {onMapReady && <MapController onReady={onMapReady} />}
    </MapContainer>
  );
}
