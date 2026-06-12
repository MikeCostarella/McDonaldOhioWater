import { useEffect, useMemo, useRef, useState } from "react";
import type { NamedCount } from "../data/loadLocations";

interface MultiSelectFilterProps {
  /** Label shown before the summary, e.g. "Jurisdiction" or "Street". */
  label: string;
  /** Noun for the summary, e.g. "jurisdictions" / "streets". */
  noun: string;
  options: NamedCount[];
  /** Set of currently-selected names. */
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  /** Show an in-panel search box (for long lists). */
  searchable?: boolean;
}

/**
 * Generic multi-select dropdown for filtering map locations. The button shows a
 * summary; the panel lists each option with its location count plus Select all
 * / Clear all, and (when searchable) a search box to narrow long lists. Closes
 * on outside click or Escape. Used for both the jurisdiction and street filters.
 */
export default function MultiSelectFilter({
  label,
  noun,
  options,
  selected,
  onChange,
  searchable = false,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const total = options.length;
  const n = selected.size;
  const summary =
    n === 0
      ? `No ${noun}`
      : n === total
        ? `All ${noun}`
        : n === 1
          ? [...selected][0]
          : `${n} of ${total} ${noun}`;

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, query]);

  const toggle = (name: string) => {
    const next = new Set(selected);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    onChange(next);
  };

  // Select/Clear all operate on the CURRENTLY VISIBLE (filtered) options so a
  // search lets you bulk-select a subset; with no search they affect everything.
  const selectAllVisible = () => {
    const next = new Set(selected);
    for (const o of filtered) next.add(o.name);
    onChange(next);
  };
  const clearAllVisible = () => {
    const next = new Set(selected);
    for (const o of filtered) next.delete(o.name);
    onChange(next);
  };

  return (
    <div className="jur-filter" ref={rootRef}>
      <button
        className="jur-filter-btn"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {label}: <b>{summary}</b>{" "}
        <span className="jur-caret">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="jur-filter-panel">
          {searchable && (
            <input
              className="jur-filter-search"
              type="text"
              placeholder={`Search ${noun}…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          )}
          <div className="jur-filter-actions">
            <button onClick={selectAllVisible}>
              {query.trim() ? "Select shown" : "Select all"}
            </button>
            <button onClick={clearAllVisible}>
              {query.trim() ? "Clear shown" : "Clear all"}
            </button>
          </div>
          <div className="jur-filter-list">
            {filtered.length === 0 ? (
              <div className="jur-filter-empty">No matches</div>
            ) : (
              filtered.map((o) => (
                <label className="jur-filter-row" key={o.name}>
                  <input
                    type="checkbox"
                    checked={selected.has(o.name)}
                    onChange={() => toggle(o.name)}
                  />
                  <span className="jur-filter-name">{o.name}</span>
                  <span className="jur-filter-count">
                    {o.count.toLocaleString()}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
