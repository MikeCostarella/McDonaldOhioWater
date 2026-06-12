import { useCallback, useEffect, useRef, useState } from "react";
import { Marker, Tooltip, useMap } from "react-leaflet";
import type { Marker as LeafletMarker } from "leaflet";
import type { FeatureCollection } from "geojson";
import { userLocationIcon } from "../data/userLocationIcon";
import { BOUNDARY_LAYERS, fetchBoundary } from "../data/boundaries";
import { jurisdictionAt } from "../data/pointInPolygon";
import UserLocationDialog, {
  type UserLocationDetail,
} from "./UserLocationDialog";

/**
 * Requests the user's location on mount and drops a pulsing "You are here"
 * marker with a permanent tooltip, flying the map to it. A round locate button
 * (bottom-left) re-triggers on demand. Clicking the marker opens a detail
 * dialog with accuracy, coordinates, and the live point-in-polygon
 * jurisdiction. If permission is denied or the browser has no geolocation, it
 * silently keeps the current view.
 *
 * Ported from the Hydrants geolocation feature; styled to the water theme.
 */
export default function GeolocationControl() {
  const map = useMap();
  const [pos, setPos] = useState<[number, number] | null>(null);
  const [acc, setAcc] = useState<number | null>(null);
  const [detail, setDetail] = useState<UserLocationDetail | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);

  // Cache the boundary layers across opens so we fetch at most once.
  const boundsRef = useRef<{
    munis: FeatureCollection | null;
    twps: FeatureCollection | null;
    loaded: boolean;
  }>({ munis: null, twps: null, loaded: false });

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const ll: [number, number] = [p.coords.latitude, p.coords.longitude];
        setPos(ll);
        setAcc(p.coords.accuracy);
        map.flyTo(ll, 16, { animate: true, duration: 1 });
      },
      () => {
        /* denied / unavailable — keep current view silently */
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, [map]);

  // Request once on mount.
  useEffect(() => {
    locate();
  }, [locate]);

  // Open the detail dialog; compute jurisdiction (fetch boundaries lazily once).
  const openDetail = useCallback(async () => {
    if (!pos) return;
    const [lat, lon] = pos;
    // Show immediately with jurisdiction still resolving.
    setDetail({ lat, lon, accuracy: acc, jurisdiction: null });

    const cache = boundsRef.current;
    if (!cache.loaded) {
      const muniDef = BOUNDARY_LAYERS.find((b) => b.id === "municipalities")!;
      const twpDef = BOUNDARY_LAYERS.find((b) => b.id === "townships")!;
      const [munis, twps] = await Promise.all([
        fetchBoundary(muniDef),
        fetchBoundary(twpDef),
      ]);
      cache.munis = munis;
      cache.twps = twps;
      cache.loaded = true;
    }

    const j = jurisdictionAt(lon, lat, cache.munis, cache.twps);
    // Only update if the dialog is still open on the same point.
    setDetail((d) =>
      d && d.lat === lat && d.lon === lon ? { ...d, jurisdiction: j } : d,
    );
  }, [pos, acc]);

  return (
    <>
      {pos && (
        <Marker
          position={pos}
          icon={userLocationIcon}
          ref={markerRef}
          eventHandlers={{ click: openDetail }}
        >
          <Tooltip permanent direction="top" offset={[0, -16]} className="user-loc-tip">
            You are here
            {acc != null && <> ({Math.round(acc)} m)</>}
          </Tooltip>
        </Marker>
      )}
      <button
        id="locate-btn"
        title="Find my location"
        aria-label="Find my location"
        onClick={locate}
      >
        &#9678;
      </button>
      <UserLocationDialog detail={detail} onClose={() => setDetail(null)} />
    </>
  );
}
