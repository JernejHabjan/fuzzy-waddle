import { AttackComponent } from "./attack-component";
import { CancelableSimDelay } from "../../../../world/services/simulation-time";

jest.mock("../../../../world/services/simulation-time", () => ({
  CancelableSimDelay: jest.fn().mockImplementation(() => ({ remove: jest.fn() }))
}));

function fixture() {
  const component = Object.create(AttackComponent.prototype);
  const lookup = jest.fn();
  Object.assign(component, {
    initialized: true,
    gameObject: { scene: {} },
    simulationTickService: { currentTick: 119 },
    actorIndexSystem: { getActorById: lookup },
    attackDefinition: { attacks: [{}] },
    projectileImpactTimers: new Set(),
    applyPendingHit: jest.fn()
  });
  return { component, lookup };
}

describe("pending attack restoration", () => {
  beforeEach(() => jest.clearAllMocks());

  it("resolves a target restored after its attacker at impact time", () => {
    const { component, lookup } = fixture();
    component.setData({ pendingHit: { targetActorId: "later-target", attackIndex: 0, dueTick: 120 } });
    expect(CancelableSimDelay).toHaveBeenCalledTimes(1);
    expect(lookup).not.toHaveBeenCalled();
    const target = {};
    lookup.mockReturnValue(target);
    jest.mocked(CancelableSimDelay).mock.calls[0][2]();
    expect(component.applyPendingHit).toHaveBeenCalledWith(expect.any(Object), target, expect.any(Object));
  });

  it("cancels the old timer when replacing only pending-hit state", () => {
    const { component } = fixture();
    const remove = jest.fn();
    component.hitTimer = { remove };
    component.setData({ pendingHit: { targetActorId: "new-target", attackIndex: 0, dueTick: 120 } });
    expect(remove).toHaveBeenCalledTimes(1);
    expect(CancelableSimDelay).toHaveBeenCalledTimes(1);
  });

  it("releases pending state when the saved target no longer exists", () => {
    const { component } = fixture();
    component.setData({ pendingHit: { targetActorId: "gone", attackIndex: 0, dueTick: 120 } });
    jest.mocked(CancelableSimDelay).mock.calls[0][2]();
    expect(component.getData().pendingHit).toBeUndefined();
    expect(component.applyPendingHit).not.toHaveBeenCalled();
  });
});
