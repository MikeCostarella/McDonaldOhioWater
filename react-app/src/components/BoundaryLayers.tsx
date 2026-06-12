import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { FeatureCollection } from "geojson";
import { BOUNDARY_LAYERS, fetchBoundary } from "../data/boundaries";

interface BoundaryLayersProps {
  /** Which boundary layers are currently visible. */
  visible: { municipalities: boolean; townships: boolean };
}

/**
 * Draws the toggled boundary outlines as imperative GeoJSON layers in a
 * dedicated map pane *under* the markers, with pointer events disabled so they
 * never intercept a marker click. Each layer is fetched lazily the first time
 * it's switched on, then cached and shown/hidden on subsequent toggles.
 */
export default function BoundaryLayers({ visible }: BoundaryLayersProps) {
  const map = useMap();
  const layersRef = useRef<Record<string, L.GeoJSON | null>>({});
  const fetchedRef = useRef<Record<string, boolean>>({});

  // Create the under-markers pane once.
  useEffect(() => {
    if (!map.getPane("boundaries")) {
      const pane = map.createPane("boundaries");
      pane.style.zIndex = "350"; // below marker pane (600), above tiles
      pane.style.pointerEvents = "none";
    }
  }, [map]);

  useEffect(() => {
    BOUNDARY_LAYERS.forEach((def) => {
      const on = visible[def.id];
      const existing = layersRef.current[def.id];

      if (on && !existing && !fetchedRef.current[def.id]) {
        fetchedRef.current[def.id] = true;
        fetchBoundary(def).then((geo: FeatureCollection | null) => {
          if (!geo) {
            fetchedRef.current[def.id] = false; // allow retry on next toggle
            return;
          }
          const isMuni = def.id === "municipalities";
          const layer = L.geoJSON(geo, {
            pane: "boundaries",
            style: {
              color: def.color,
              weight: isMuni ? 3.5 : 2.5,
              opacity: isMuni ? 1 : 0.85,
              fill: false,
              dashArray: def.dashArray,
              lineJoin: "round",
            },
          });
          layersRef.current[def.id] = layer;
          // Only add if still toggled on by the time the fetch resolves.
          if (visible[def.id]) layer.addTo(map);
        });
      } else if (on && existing) {
        existing.addTo(map);
      } else if (!on && existing) {
        existing.remove();
      }
    });
  }, [map, visible]);

  // Clean up on unmount.
  useEffect(() => {
    return () => {
      Object.values(layersRef.current).forEach((l) => l?.remove());
    };
  }, []);

  return null;
}
