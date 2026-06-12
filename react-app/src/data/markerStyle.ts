// Marker color + size ramps by account count at a location.
// Ported verbatim from the prototype's getColor() / getRadius().

/** Fill color for a location marker based on how many accounts it holds. */
export function colorForCount(count: number): string {
  if (count === 1) return "#2196F3"; // single account  - blue
  if (count <= 4) return "#FF9800"; // 2-4 accounts    - orange
  if (count <= 9) return "#F44336"; // 5-9 accounts    - red
  return "#9C27B0"; //               10+ accounts     - purple
}

/** Circle-marker radius (px) based on account count. */
export function radiusForCount(count: number): number {
  if (count === 1) return 5;
  if (count <= 4) return 7;
  if (count <= 9) return 9;
  return 11;
}

/** Legend rows, kept next to the ramps so they never drift apart. */
export const DENSITY_LEGEND: ReadonlyArray<{ color: string; label: string }> = [
  { color: "#2196F3", label: "Single account" },
  { color: "#FF9800", label: "2\u20134 accounts" },
  { color: "#F44336", label: "5\u20139 accounts" },
  { color: "#9C27B0", label: "10+ accounts" },
];
