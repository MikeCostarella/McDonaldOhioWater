import { useState } from "react";
import { DENSITY_LEGEND } from "../data/markerStyle";
import { BOUNDARY_LAYERS } from "../data/boundaries";

interface LegendProps {
  boundaryVisible: { municipalities: boolean; townships: boolean };
  onToggleBoundary: (id: "municipalities" | "townships") => void;
}

/**
 * Bottom-right key. Shows the "Account Density" color ramp plus a "Boundaries"
 * section with toggles for the municipal and township outlines. Collapsible.
 */
export default function Legend({ boundaryVisible, onToggleBoundary }: LegendProps) {
  // Start collapsed on phones (same 640px breakpoint as the mobile CSS) so the
  // legend doesn't cover a large share of the map; open by default on desktop.
  const [collapsed, setCollapsed] = useState(
    () => window.matchMedia("(max-width: 640px)").matches,
  );

  return (
    <div id="legend" className={collapsed ? "collapsed" : ""}>
      <div id="legend-header" onClick={() => setCollapsed((c) => !c)}>
        <span>Account Density</span>
        <span id="legend-toggle">{collapsed ? "\u25B2" : "\u25BC"}</span>
      </div>
      {!collapsed && (
        <div id="legend-body">
          {DENSITY_LEGEND.map((row) => (
            <div className="legend-row" key={row.label}>
              <span className="legend-dot" style={{ background: row.color }} />
              {row.label}
            </div>
          ))}

          <div className="legend-subhead">Boundaries</div>
          {BOUNDARY_LAYERS.map((def) => (
            <label className="legend-toggle-row" key={def.id}>
              <input
                type="checkbox"
                checked={boundaryVisible[def.id]}
                onChange={() => onToggleBoundary(def.id)}
              />
              <span
                className="legend-line"
                style={{
                  borderTopColor: def.color,
                  borderTopStyle: def.dashArray ? "dashed" : "solid",
                }}
              />
              {def.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
