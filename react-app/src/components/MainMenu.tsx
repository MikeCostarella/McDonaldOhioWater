import { useEffect, useRef, useState } from "react";

export type AppView = "map" | "list";

interface MainMenuProps {
  view: AppView;
  onViewChange: (view: AppView) => void;
}

/**
 * Hamburger menu in the header. Holds a "View" section that switches between
 * the Map and the Water Locations List (table), plus a "Links" section.
 *
 * Opens on click; closes on item select, a click outside, or Escape.
 */
export default function MainMenu({ view, onViewChange }: MainMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (v: AppView) => {
    onViewChange(v);
    setOpen(false);
  };

  return (
    <div id="main-menu" ref={ref}>
      <button
        id="main-menu-btn"
        type="button"
        aria-label="Menu"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="menu-bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      {open && (
        <div id="main-menu-dropdown" role="menu">
          <div className="menu-section-label">View</div>
          <button
            type="button"
            role="menuitemradio"
            aria-checked={view === "map"}
            className={`menu-item${view === "map" ? " active" : ""}`}
            onClick={() => pick("map")}
          >
            Map
          </button>
          <button
            type="button"
            role="menuitemradio"
            aria-checked={view === "list"}
            className={`menu-item${view === "list" ? " active" : ""}`}
            onClick={() => pick("list")}
          >
            Water Locations List
          </button>

          <div className="menu-section-label">Links</div>
          <a
            role="menuitem"
            className="menu-item"
            href="https://mikecostarella.github.io/MyWebSite/"
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
          >
            MyWebSite &#8599;
          </a>
          <a
            role="menuitem"
            className="menu-item"
            href="https://github.com/MikeCostarella/McDonaldOhioWater"
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
          >
            GitHub Repository &#8599;
          </a>
          <a
            role="menuitem"
            className="menu-item"
            href="https://github.com/MikeCostarella/McDonaldOhioWater/actions"
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
          >
            GitHub Actions &#8599;
          </a>
        </div>
      )}
    </div>
  );
}
