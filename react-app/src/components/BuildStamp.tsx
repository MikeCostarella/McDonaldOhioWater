/**
 * Footer strip showing when this build was produced (injected at build time
 * via the __BUILD_TIME__ define in vite.config.ts) plus an attribution line.
 */
export default function BuildStamp() {
  // __BUILD_TIME__ is an ISO string; format it for display, falling back to
  // the raw value if the date can't be parsed for any reason.
  let built = __BUILD_TIME__;
  try {
    built = new Date(__BUILD_TIME__).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    /* keep raw ISO string */
  }

  return (
    <div id="footer">
      <span>McDonald Ohio Water Accounts Map &middot; Mike Costarella</span>
      <span id="build-time">Build: {built}</span>
    </div>
  );
}
