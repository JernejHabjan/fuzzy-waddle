import { ActorManager } from "./actor-manager";
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";

describe("ActorManager", () => {
  describe("actorMap", () => {
    it("All ObjectNames should be contained in ActorManager", () => {
      const enumValues = Object.values(ObjectNames);
      const missingActors: string[] = [];

      enumValues.forEach((enumValue) => {
        if (!ActorManager.actorMap[enumValue]) {
          missingActors.push(enumValue);
        }
      });

      expect(missingActors).toEqual([]);
    });

    it("should have constructors for all mapped actors", () => {
      const actorMapEntries = Object.entries(ActorManager.actorMap);

      actorMapEntries.forEach(([name, constructor]) => {
        expect(constructor).toBeDefined();
        expect(typeof constructor).toBe("function");
      });
    });
  });
});
