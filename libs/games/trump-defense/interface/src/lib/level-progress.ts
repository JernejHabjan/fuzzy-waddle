const STORAGE_KEY = "trump-defense-unlocked-level";
type LevelNumber = 1 | 2 | 3;
const ALL_LEVELS: readonly LevelNumber[] = [1, 2, 3];

/** Browser privacy modes can throw even while reading the localStorage property. */
function availableStorage(storage?: Storage): Storage | undefined {
  if (storage) return storage;
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

/** Reads the highest campaign level earned; development builds expose all levels for testing. */
export function getUnlockedLevels(debug: boolean, storage?: Storage): LevelNumber[] {
  if (debug) return [...ALL_LEVELS];
  const store = availableStorage(storage);
  if (!store) return [1];
  try {
    const value = Number(store.getItem(STORAGE_KEY));
    const highest = Number.isInteger(value) && value >= 1 && value <= 3 ? value : 1;
    return ALL_LEVELS.filter((level) => level <= highest);
  } catch {
    return [1];
  }
}

/** Persists campaign progress monotonically after a level victory. */
export function unlockLevel(completed: LevelNumber, debug: boolean, storage?: Storage): LevelNumber[] {
  if (debug) return [...ALL_LEVELS];
  const store = availableStorage(storage);
  const current = getUnlockedLevels(false, store).length;
  const highest = Math.min(3, Math.max(current, completed + 1));
  if (store) {
    try {
      store.setItem(STORAGE_KEY, String(highest));
    } catch {
      // Storage can be disabled by browser privacy settings; the current run still continues.
    }
  }
  return ALL_LEVELS.filter((level) => level <= highest);
}
