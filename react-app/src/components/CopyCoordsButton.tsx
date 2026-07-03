import { useState } from "react";
import { copyToClipboard } from "../data/clipboard";

interface Props {
  lat: number;
  lon: number;
  /** Button text when idle. Defaults to "Copy Coordinates". */
  label?: string;
}

/**
 * Button that copies "lat, lon" (6 decimals) to the clipboard, briefly flipping
 * to a "Copied" confirmation. Styled as a map-btn so it sits in the dialog's
 * action button row. Shared by the account and user-location dialogs.
 */
export default function CopyCoordsButton({ lat, lon, label = "Copy Coordinates" }: Props) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    const ok = await copyToClipboard(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  };
  return (
    <button
      type="button"
      className="map-btn btn-copy"
      onClick={onCopy}
      aria-label="Copy coordinates"
      title="Copy latitude, longitude"
    >
      {copied ? "✓ Copied" : `⧉ ${label}`}
    </button>
  );
}
