import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { getCanonicalActorNameCached } from "./canonical-actor-name";

describe("CanonicalName", () => {
  describe("Canonical Actor Names", () => {
    it("should return parent actor for randomOfType variants", () => {
      // TivaraWorkerMale is a variant of TivaraWorker
      const canonicalName = getCanonicalActorNameCached(ObjectNames.TivaraWorkerMale);
      expect(canonicalName).toBe(ObjectNames.TivaraWorker);

      // TivaraWorkerFemale is a variant of TivaraWorker
      const canonicalName2 = getCanonicalActorNameCached(ObjectNames.TivaraWorkerFemale);
      expect(canonicalName2).toBe(ObjectNames.TivaraWorker);

      // SkaduweeWorkerMale is a variant of SkaduweeWorker
      const canonicalName3 = getCanonicalActorNameCached(ObjectNames.SkaduweeWorkerMale);
      expect(canonicalName3).toBe(ObjectNames.SkaduweeWorker);
    });

    it("should return actor name as-is for non-variants", () => {
      // AnkGuard is not a variant of anything
      const canonicalName = getCanonicalActorNameCached(ObjectNames.AnkGuard);
      expect(canonicalName).toBe(ObjectNames.AnkGuard);

      // Sandhold is not a variant
      const canonicalName2 = getCanonicalActorNameCached(ObjectNames.Sandhold);
      expect(canonicalName2).toBe(ObjectNames.Sandhold);
    });

    it("should use cache for repeated lookups", () => {
      // First call builds cache
      const first = getCanonicalActorNameCached(ObjectNames.TivaraWorkerMale);

      // Second call uses cache
      const second = getCanonicalActorNameCached(ObjectNames.TivaraWorkerMale);

      expect(first).toBe(second);
      expect(first).toBe(ObjectNames.TivaraWorker);
    });
  });
});
