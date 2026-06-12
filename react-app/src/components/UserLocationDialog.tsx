import { useEffect } from "react";

export interface UserLocationDetail {
  lat: number;
  lon: number;
  accuracy: number | null;
  /** null = still computing; string = resolved jurisdiction label. */
  jurisdiction: string | null;
}

interface UserLocationDialogProps {
  detail: UserLocationDetail | null;
  onClose: () => void;
}

/**
 * "You are here" detail modal, shown when the user clicks their own location
 * marker. Mirrors AccountDialog's styling but lists the geolocation fields:
 * accuracy, coordinates, and the live point-in-polygon jurisdiction.
 */
export default function UserLocationDialog({ detail, onClose }: UserLocationDialogProps) {
  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [detail, onClose]);

  if (!detail) return null;

  return (
    <div
      id="dialog-overlay"
      className="active"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div id="dialog">
        <div id="dialog-header">
          <h2 id="dialog-title">&#128205; You Are Here</h2>
          <button id="dialog-close" onClick={onClose} aria-label="Close">
            &#x2715;
          </button>
        </div>
        <div id="dialog-body">
          <div className="acct-card">
            <div className="acct-row">
              <span className="label">Accuracy:</span>
              {detail.accuracy != null ? `${Math.round(detail.accuracy)} m` : "Unknown"}
            </div>
            <div className="acct-row">
              <span className="label">Latitude:</span>
              {detail.lat.toFixed(6)}
            </div>
            <div className="acct-row">
              <span className="label">Longitude:</span>
              {detail.lon.toFixed(6)}
            </div>
            <div className="acct-row">
              <span className="label">Jurisdiction:</span>
              {detail.jurisdiction === null ? (
                <span style={{ opacity: 0.7 }}>Locating…</span>
              ) : (
                detail.jurisdiction
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
