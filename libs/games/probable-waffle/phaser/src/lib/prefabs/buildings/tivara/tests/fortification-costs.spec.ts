import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { watchTowerDefinition } from "../WatchTower/watch-tower.definition";
import { wallDefinition } from "../wall/wall.definition";
import { stairsDefinition } from "../stairs/stairs.definition";

describe("Tivara fortification construction costs", () => {
  it("uses the shared reduced stone prices for towers, walls and stairs", () => {
    expect(watchTowerDefinition.components.productionCost.resources[ResourceType.Stone]).toBe(150);
    expect(wallDefinition.components.productionCost.resources[ResourceType.Stone]).toBe(15);
    expect(stairsDefinition.components.productionCost.resources[ResourceType.Stone]).toBe(15);
  });
});
