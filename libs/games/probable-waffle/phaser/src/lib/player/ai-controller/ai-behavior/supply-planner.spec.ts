import { FactionType, ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import { SupplyPlanner } from "./supply-planner";
import type { PlayerAiBlackboard } from "../player-ai-blackboard";

describe("SupplyPlanner housing capability", () => {
  let techTree: TechTreeService;
  let planner: SupplyPlanner;

  beforeEach(() => {
    techTree = new TechTreeService();
    planner = new SupplyPlanner({} as PlayerAiBlackboard);
  });

  it.each([
    [FactionType.Tivara, ObjectNames.Olival],
    [FactionType.Skaduwee, ObjectNames.Emberstone]
  ])("selects the constructible positive-housing building for %s", (faction, expected) => {
    expect(planner.getHousingObjectName(techTree, faction)).toBe(expected);
  });

  it("reports no candidate when the faction builder has no housing capability", () => {
    jest.spyOn(techTree, "getConstructableBuildings").mockReturnValue([]);

    expect(planner.getHousingObjectName(techTree, FactionType.Tivara)).toBeNull();
  });
});
