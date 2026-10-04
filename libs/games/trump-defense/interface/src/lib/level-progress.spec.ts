import { getUnlockedLevels, unlockLevel } from "./level-progress";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
    key: (index) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    }
  };
}

function blockedStorage(): Storage {
  return {
    ...memoryStorage(),
    setItem: () => {
      throw new Error("Storage is blocked.");
    }
  };
}

describe("campaign level progress", () => {
  it("unlocks only the first level for a new production save", () => {
    expect(getUnlockedLevels(false, memoryStorage())).toEqual([1]);
  });

  it("unlocks levels in order and never loses progress", () => {
    const storage = memoryStorage();
    expect(unlockLevel(1, false, storage)).toEqual([1, 2]);
    expect(unlockLevel(1, false, storage)).toEqual([1, 2]);
    expect(unlockLevel(2, false, storage)).toEqual([1, 2, 3]);
  });

  it("opens the full campaign in debug builds without persistence", () => {
    expect(getUnlockedLevels(true, memoryStorage())).toEqual([1, 2, 3]);
    expect(unlockLevel(1, true, memoryStorage())).toEqual([1, 2, 3]);
  });

  it("lets the active campaign advance when browser storage is blocked", () => {
    expect(unlockLevel(1, false, blockedStorage())).toEqual([1, 2]);
  });
});
