import { useEffect } from "react";

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Help / how-to modal describing the app's features. Reuses the shared dialog
 * shell (#dialog-overlay / #dialog) and closes on the X, a backdrop click, or
 * the Escape key. Opened from the header "?" button.
 */
export default function HelpDialog({ open, onClose }: HelpDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

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
          <h2 id="dialog-title">&#10067; Help &amp; How to Use This Map</h2>
          <button id="dialog-close" onClick={onClose} aria-label="Close">
            &#x2715;
          </button>
        </div>
        <div id="dialog-body">
          <div className="help-body">
            <p className="help-intro">
              This map shows the Village of McDonald's municipal water service
              accounts — one marker per service location. Use search and the
              filters to find accounts, and click any marker for details.
            </p>

            <h3 className="help-heading">Search</h3>
            <p>
              Type an account number or street address and press <b>Search</b>{" "}
              (or Enter) to fly to and open the matching location. Use{" "}
              <b>Clear</b> to reset the view.
            </p>

            <h3 className="help-heading">Filters</h3>
            <p>
              <b>Jurisdiction</b> and <b>Street</b> are multi-select dropdowns
              with per-item counts; the Street filter has its own search box.
              They combine to narrow which markers are shown.
            </p>

            <h3 className="help-heading">Map</h3>
            <p>
              Each circle is one service location, colored and sized by how many
              accounts share it — see the <b>Account Density</b> legend
              (single, 2–4, 5–9, 10+). Nearby markers cluster at lower zooms and
              separate as you zoom in. Toggle the <b>Municipalities</b> and{" "}
              <b>Townships</b> boundary overlays from the legend.
            </p>

            <h3 className="help-heading">Account details</h3>
            <p>
              Clicking a marker shows the account's address, jurisdiction, and
              coordinates, with buttons to copy the coordinates, view the
              address on Google Maps, or get directions.
            </p>

            <h3 className="help-heading">Your location</h3>
            <p>
              The map can show a "You are here" marker and fly to it. Click the
              marker for your accuracy, coordinates, and the jurisdiction you're
              standing in; use the round locate button (bottom-left) to
              re-center on yourself.
            </p>

            <h3 className="help-heading">Install &amp; offline</h3>
            <p>
              This is an installable app (PWA). You can add it to your home
              screen or desktop, and map tiles and data are cached for offline
              use after the first visit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
