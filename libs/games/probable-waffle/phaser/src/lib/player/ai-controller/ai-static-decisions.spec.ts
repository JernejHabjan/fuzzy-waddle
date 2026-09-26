import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { getMostNeededResource, isEnemyPlayerWeak } from "./ai-static-decisions";

describe("legacy AI static decisions", () => {
  it.each([
    [10, 5, true],
    [5, 10, false],
    [5, 5, false],
    [0, 0, false],
    [1, 0, true],
    [0, 1, false]
  ])("treats own=%i and enemy=%i as weak=%s", (ownStrength, enemyStrength, expected) => {
    expect(isEnemyPlayerWeak(ownStrength, enemyStrength)).toBe(expected);
  });

  it("returns a stable, non-null demand instead of silently disabling logistics", () => {
    expect(
      getMostNeededResource({
        resources: {
          [ResourceType.Wood]: 30,
          [ResourceType.Stone]: 90,
          [ResourceType.Minerals]: 90,
          [ResourceType.Food]: 90
        },
        reserved: {
          [ResourceType.Wood]: 10,
          [ResourceType.Stone]: 0,
          [ResourceType.Minerals]: 0,
          [ResourceType.Food]: 0
        },
        incomeSmoothed: {
          [ResourceType.Wood]: 0,
          [ResourceType.Stone]: 0,
          [ResourceType.Minerals]: 0,
          [ResourceType.Food]: 0
        }
      })
    ).toEqual({ type: ResourceType.Wood, amount: 80 });
  });
});
