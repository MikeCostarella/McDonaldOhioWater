import { useEffect } from "react";
import type { WaterLocation } from "../types/account";
import { HOME_JURISDICTION } from "../types/account";
import CopyCoordsButton from "./CopyCoordsButton";

interface AccountDialogProps {
  /** The selected location, or null when the dialog is closed. */
  location: WaterLocation | null;
  onClose: () => void;
}

/**
 * Detail modal shown when a marker is clicked. Lists every account at the
 * location with address, coordinates, and Google Maps / Directions links.
 * Ported from the prototype's openDialog(); the Auditor parcel button is
 * intentionally omitted.
 *
 * Closes on the X button, a backdrop click, or the Escape key.
 */
export default function AccountDialog({ location, onClose }: AccountDialogProps) {
  // Escape-to-close, registered only while the dialog is open.
  useEffect(() => {
    if (!location) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [location, onClose]);

  if (!location) return null;

  const accts = location.accounts;
  const title =
    accts.length === 1 ? "Account Details" : `${accts.length} Accounts at this Location`;
  const outside =
    location.jurisdiction && location.jurisdiction !== HOME_JURISDICTION;

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
          <h2 id="dialog-title">{title}</h2>
          <button id="dialog-close" onClick={onClose} aria-label="Close">
            &#x2715;
          </button>
        </div>
        {location.jurisdiction && (
          <div className={`dialog-jurisdiction${outside ? " outside" : ""}`}>
            {outside ? "⚑ " : ""}
            Jurisdiction: <b>{location.jurisdiction}</b>
            {outside ? " (outside McDonald city limits)" : ""}
          </div>
        )}
        <div id="dialog-body">
          {accts.map((a) => {
            const gmapQ = encodeURIComponent(
              `${a.street}, ${a.city}, ${a.state} ${a.zip}`,
            );
            const gmapLink = `https://www.google.com/maps/search/?api=1&query=${gmapQ}`;
            const dirLink = `https://www.google.com/maps/dir/?api=1&destination=${a.lat},${a.lon}`;

            return (
              <div className="acct-card" key={a.acct}>
                <div className="acct-num">&#128200; Account #{a.acct}</div>
                <div className="acct-row">
                  <span className="label">Address:</span>
                  {a.street}
                </div>
                <div className="acct-row">
                  <span className="label">City/State:</span>
                  {a.city}, {a.state} {a.zip}
                </div>
                <div className="coord-block">
                  <div className="coord-vals">
                    <div className="acct-row">
                      <span className="label">Latitude:</span>
                      {a.lat.toFixed(6)}
                    </div>
                    <div className="acct-row">
                      <span className="label">Longitude:</span>
                      {a.lon.toFixed(6)}
                    </div>
                  </div>
                  <CopyCoordsButton lat={a.lat} lon={a.lon} label="Copy" />
                </div>
                <div className="btn-row">
                  <a
                    className="map-btn btn-gmap"
                    href={gmapLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    &#128205; View on Google Maps
                  </a>
                  <a
                    className="map-btn btn-dir"
                    href={dirLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    &#128663; Get Directions
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
