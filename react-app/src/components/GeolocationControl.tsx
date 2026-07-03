import { useCallback, useEffect, useRef, useState } from "react";
import { Marker, Tooltip, useMap } from "react-leaflet";
import type { Marker as LeafletMarker } from "leaflet";
import type { FeatureCollection } from "geojson";
import { userLocationIcon } from "../data/userLocationIcon";
import { BOUNDARY_LAYERS, fetchBoundary } from "../data/boundaries";
import { jurisdictionAt } from "../data/pointInPolygon";
import type { DataBounds } from "./WaterMap";
import UserLocationDialog, {
  type UserLocationDetail,
} from "./UserLocationDialog";

interface GeolocationControlProps {
  /**
   * Bounding box of all service locations. Used to decide the initial framing:
   * if the user is standing outside it, we zoom to show the whole McDonald
   * service area rather than flying to an empty spot on the user.
   */
  dataBounds?: DataBounds | null;
}

/** True when [lat, lon] falls inside the data bounding box. */
function within(lat: number, lon: number, b: DataBounds): boolean {
  return (
    lat >= b[0][0] && lat <= b[1][0] && lon >= b[0][1] && lon <= b[1][1]
  );
}

/**
 * Requests the user's location on mount and drops a pulsing "You are here"
 * marker with a permanent tooltip. Initial framing depends on where the user
 * is: inside the McDonald service area we fly to them at street zoom; outside
 * it we frame both the user and the whole service area so the accounts stay
 * visible. The round locate button (bottom-left) always flies to the user.
 * Clicking the marker opens a detail dialog with accuracy, coordinates, and the
 * live point-in-polygon jurisdiction. If permission is denied or the browser
 * has no geolocation, it silently keeps the current view.
 */
export default function GeolocationControl({
  dataBounds = null,
}: GeolocationControlProps) {
  const map = useMap();
  const [pos, setPos] = useState<[number, number] | null>(null);
  const [acc, setAcc] = useState<number | null>(null);
  const [detail, setDetail] = useState<UserLocationDetail | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  // Ensures the automatic "frame on load" logic runs at most once.
  const framedRef = useRef(false);

  // Cache the boundary layers across opens so we fetch at most once.
  const boundsRef = useRef<{
    munis: FeatureCollection | null;
    twps: FeatureCollection | null;
    loaded: boolean;
  }>({ munis: null, twps: null, loaded: false });

  // Acquire the user's position. When `flyToUser` is true (the locate button)
  // we always fly to them; on mount we defer framing to the effect below so the
  // decision can wait for the location data to load.
  const locate = useCallback(
    (flyToUser: boolean) => {
      if (!("geolocation" in navigator)) return;
      navigator.geolocation.getCurrentPosition(
        (p) => {
          const ll: [number, number] = [
            p.coords.latitude,
            p.coords.longitude,
          ];
          setPos(ll);
          setAcc(p.coords.accuracy);
          if (flyToUser) {
            map.flyTo(ll, 16, { animate: true, duration: 1 });
          }
        },
        () => {
          /* denied / unavailable — keep current view silently */
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    },
    [map],
  );

  // Request once on mount (without an immediate fly — see framing effect).
  useEffect(() => {
    locate(false);
  }, [locate]);

  // Initial framing: once we know both the user's position and the data extent,
  // frame the map exactly once. Inside the service area -> fly to the user;
  // outside it -> fit a box covering BOTH the user and all McDonald locations.
  useEffect(() => {
    if (framedRef.current) return;
    if (!pos || !dataBounds) return;
    framedRef.current = true;
    const [lat, lon] = pos;
    if (within(lat, lon, dataBounds)) {
      map.flyTo(pos, 16, { animate: true, duration: 1 });
    } else {
      const combined: DataBounds = [
        [Math.min(dataBounds[0][0], lat), Math.min(dataBounds[0][1], lon)],
        [Math.max(dataBounds[1][0], lat), Math.max(dataBounds[1][1], lon)],
      ];
      map.flyToBounds(combined, {
        padding: [60, 60],
        maxZoom: 15,
        animate: true,
        duration: 1,
      });
    }
  }, [pos, dataBounds, map]);

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
        onClick={() => locate(true)}
      >
        &#9678;
      </button>
      <UserLocationDialog detail={detail} onClose={() => setDetail(null)} />
    </>
  );
}
