import { environment } from "../../../../../../environments/environment";

const DEBUG_STORAGE_KEY = "probableWaffle.multiplayerDebug";
const DEBUG_QUERY_PARAM = "pwNetDebug";

/**
 * Enables verbose netcode logs only in local/dev builds.
 * Toggle from the browser with localStorage.setItem("probableWaffle.multiplayerDebug", "true")
 * or append ?pwNetDebug=1 to the URL before loading the match.
 */
export function isMultiplayerDebugEnabled(): boolean {
  if (environment.production) {
    return false;
  }
  try {
    return (
      globalThis.localStorage?.getItem(DEBUG_STORAGE_KEY) === "true" ||
      globalThis.location?.search.includes(DEBUG_QUERY_PARAM) === true
    );
  } catch {
    return false;
  }
}
