import { combatActor, squad, fixtureState, observation, manager } from "./ai-tactics-test-fixtures";
import { canPursueAiTacticalObjective } from "./ai-tactics-objective-eligibility";

describe("tactical objective eligibility", () => {
  it.each([3, 10])("a blocked movement route still permits a shot only within actual weapon range: %s", (x) => {
    const actor = {
      ...combatActor("guard", "self", 0),
      accessNodeId: {
        status: "known" as const,
        value: "access:home" as const,
        observedTick: 100
      }
    };
    const target = {
      ...combatActor("target", "enemy", x),
      accessNodeId: {
        status: "known" as const,
        value: "access:target" as const,
        observedTick: 100
      }
    };
    const world = {
      ...observation([actor, target]),
      accessProducts: [
        {
          queryId: "route:target",
          revision: 1,
          status: "blocked" as const,
          fromNodeId: actor.accessNodeId.value,
          toNodeId: target.accessNodeId.value,
          domains: ["ground" as const],
          updatedTick: 100
        }
      ]
    };
    expect(canPursueAiTacticalObjective([actor], target, world)).toBe(x === 3);
  });
  it("does not let an untargetable high-value flyer distract ground-only weapons", () => {
    const actor = combatActor("guard", "self", 0, "ground", 1000, { damage: 100, targetDomains: ["ground"] });
    const flyer = combatActor("flying-core", "enemy", 5, "air", 1000, { damage: 0, mainBuilding: true });
    const ground = combatActor("ground", "enemy", 12, "ground", 1000, { damage: 1, capabilityFamilies: ["produce"] });
    const result = manager.propose(
      observation([actor, flyer, ground]),
      fixtureState([{ ...squad("squad:defense", "defense", [actor.actorId]), objectiveId: flyer.actorId }])
    );
    expect(result.statePatch?.squadUpdates?.[0]?.tactics?.targetActorId).toBe(ground.actorId);
  });

  it.each(["blocked", "service_failed"] as const)("releases a committed objective with a known %s route", (status) => {
    const actor = {
      ...combatActor("guard", "self", 0, "ground", 1000, { damage: 100 }),
      accessNodeId: { status: "known" as const, value: "access:home" as const, observedTick: 100 }
    };
    const core = {
      ...combatActor("core", "enemy", 10, "ground", 1000, { damage: 0, mainBuilding: true }),
      accessNodeId: { status: "known" as const, value: "access:blocked" as const, observedTick: 100 }
    };
    const ground = combatActor("ground", "enemy", 12, "ground", 1000, { damage: 1, capabilityFamilies: ["produce"] });
    const world = {
      ...observation([actor, core, ground]),
      accessProducts: [
        {
          queryId: "route:core",
          revision: 1,
          status,
          fromNodeId: actor.accessNodeId.value,
          toNodeId: core.accessNodeId.value,
          domains: ["ground" as const],
          updatedTick: 100
        }
      ]
    };
    const result = manager.propose(
      world,
      fixtureState([{ ...squad("squad:defense", "defense", [actor.actorId]), objectiveId: core.actorId }])
    );
    expect(result.statePatch?.squadUpdates?.[0]?.tactics?.targetActorId).toBe(ground.actorId);
  });
});
