import type { WaterLocation } from "../types/account";
import { HOME_JURISDICTION } from "../types/account";

/**
 * Tooltip HTML for a location marker. Single-account locations show address +
 * account number; multi-account show the first street and a count. When the
 * location is outside the home jurisdiction, a magenta jurisdiction line is
 * appended (Girard serving beyond its limits).
 */
export function tooltipHtml(loc: WaterLocation): string {
  const accts = loc.accounts;
  let body: string;
  if (accts.length === 1) {
    const a = accts[0];
    body = `<b>${a.street}</b><br>${a.city}, ${a.state} ${a.zip}<br><span style="color:#5bc4f5">Acct: ${a.acct}</span>`;
  } else {
    const streets = [...new Set(accts.map((a) => a.street))];
    body = `<b>${streets[0]}</b>${streets.length > 1 ? " + more" : ""}<br><span style="color:#FF9800"><b>${accts.length} accounts</b></span>`;
  }
  if (loc.jurisdiction && loc.jurisdiction !== HOME_JURISDICTION) {
    body += `<br><span style="color:#E040FB">⚑ ${loc.jurisdiction}</span>`;
  }
  return body;
}
