import { BehaviourTree, State } from "mistreevous";
import { PawnResourceBehaviorMdsl } from "./pawn-resource-behavior.mdsl";

/** Real resource branches with controlled physical predicates; no fake elapsed growth or native credit is claimed. */
function fixture(full: boolean, ripe: boolean, tendable = true) {
  let order = "gather";
  const agent = {
    PlayerOrderIs: (kind: string) => kind === order,
    TargetHasTendableComponent: () => tendable,
    GrowthReady: () => ripe,
    GrowthPercentBelow: () => !ripe,
    TargetHasResources: () => ripe,
    TargetExists: () => true,
    TargetIsAlive: () => true,
    HasHarvestComponent: () => true,
    GatherCapacityFull: () => full,
    SelfIsAlive: () => true,
    CooldownReady: () => true,
    InRange: () => State.SUCCEEDED,
    AssignSelfAsTender: jest.fn(() => State.SUCCEEDED),
    MoveToRandomSpotOnTarget: jest.fn(() => State.SUCCEEDED),
    PlaySeedingAnimation: () => State.SUCCEEDED,
    PlayTendingAnimation: () => State.SUCCEEDED,
    AcquireNewResourceSource: jest.fn(() => State.SUCCEEDED),
    AcquireNewResourceDrain: () => State.SUCCEEDED,
    Stop: jest.fn(() => State.SUCCEEDED),
    AssignDropOffResourcesOrder: jest.fn(() => {
      order = "returnResources";
      return State.SUCCEEDED;
    }),
    AssignGatherResourcesOrder: jest.fn(() => {
      order = "gather";
      return State.SUCCEEDED;
    }),
    LeaveConstructionSiteOrCurrentContainer: () => State.SUCCEEDED,
    MoveToTarget: () => State.SUCCEEDED,
    GatherResource: jest.fn(() => State.SUCCEEDED),
    DropOffResources: jest.fn(() => State.SUCCEEDED)
  };
  const tree = new BehaviourTree(
    `root { selector { branch [Gather] branch [ReturnResources] } }\n${PawnResourceBehaviorMdsl}`,
    agent,
    { getDeltaTime: () => 0.1 }
  );
  return { agent, tree };
}

describe("native resource branch ordering", () => {
  it.each([false, true])("returns a full pack before tending/reacquiring a Field with ripe=%s", (ripe) => {
    const { agent, tree } = fixture(true, ripe);
    tree.step();
    expect(agent.AssignDropOffResourcesOrder).toHaveBeenCalledTimes(1);
    expect(agent.AssignSelfAsTender).not.toHaveBeenCalled();
    expect(agent.AcquireNewResourceSource).not.toHaveBeenCalled();
    expect(agent.GatherResource).not.toHaveBeenCalled();
    tree.step();
    expect(agent.DropOffResources).toHaveBeenCalledTimes(1);
  });

  it("returns a full non-crop pack before looking for a replacement depleted source", () => {
    const { agent, tree } = fixture(true, false, false);
    tree.step();
    expect(agent.AssignDropOffResourcesOrder).toHaveBeenCalledTimes(1);
    expect(agent.AcquireNewResourceSource).not.toHaveBeenCalled();
  });

  it("continues tending an unripe Field while the pack has room", () => {
    const { agent, tree } = fixture(false, false);
    tree.step();
    expect(agent.AssignSelfAsTender).toHaveBeenCalledTimes(1);
    expect(agent.AssignDropOffResourcesOrder).not.toHaveBeenCalled();
    expect(agent.GatherResource).not.toHaveBeenCalled();
  });

  it("harvests a ripe Field while the pack has room", () => {
    const { agent, tree } = fixture(false, true);
    tree.step();
    expect(agent.GatherResource).toHaveBeenCalledTimes(1);
    expect(agent.AssignSelfAsTender).not.toHaveBeenCalled();
    expect(agent.AssignDropOffResourcesOrder).not.toHaveBeenCalled();
  });
});
