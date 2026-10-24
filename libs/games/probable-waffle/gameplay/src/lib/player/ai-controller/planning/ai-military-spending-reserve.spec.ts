import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { catalog } from "./ai-macro-test-fixtures";
import { nextAiMilitarySpendingReserve } from "./ai-military-spending-reserve";

it("reserves the cheapest compatible definition cost from a real producer and releases it without one", () => {
  const priced = {
    ...catalog,
    entries: catalog.entries.map((entry) => ({
      ...entry,
      constructionProfile: {
        resourceCost:
          entry.sourceObjectName === ObjectNames.TivaraMacemanMale
            ? { [ResourceType.Food]: 100 }
            : { [ResourceType.Wood]: 20 },
        footprintRadiusTiles: 0,
        visionRange: 8,
        navigableHeight: null,
        enterHeight: null,
        exitHeight: null
      }
    }))
  };
  const producer = { ...createAiTestOwnedActor("producer"), objectName: ObjectNames.AnkGuard };
  expect(nextAiMilitarySpendingReserve([producer], priced, "ground")).toEqual({ [ResourceType.Wood]: 20 });
  expect(nextAiMilitarySpendingReserve([producer], priced, "air")).toEqual({});
  expect(nextAiMilitarySpendingReserve([], priced, "ground")).toEqual({});
});
