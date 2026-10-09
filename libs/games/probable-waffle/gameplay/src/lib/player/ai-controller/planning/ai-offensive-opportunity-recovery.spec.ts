import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";

import { createAiTestOwnedActor } from "../testing/ai-test-fixtures";

import { guard, core, world, brain, manager } from "./ai-offensive-opportunity-test-fixtures";

describe("fastest credible offense", () => {
  it("changes plan when the same force has lost its worker economy", () => {
    const initial = brain();
    const completedOpening: AiBrainStateV1 = {
      ...initial,
      opening: { ...initial.opening, plan: { ...initial.opening.plan, lifecycle: "completed" } }
    };
    const actors = [guard("a", "self", 0), core("enemy-core")];
    const healthyWorkers = [1, 2, 3, 4, 5, 6].map((index) => ({
      ...createAiTestOwnedActor(`worker-${index}`),
      capabilities: [
        {
          id: `worker-${index}:gather`,
          family: "gather",
          level: 1,
          domains: ["ground" as const],
          targetDomains: [],
          capacity: { status: "known" as const, value: 1, observedTick: 20 }
        }
      ]
    }));

    const strong = manager.propose(world([...actors, ...healthyWorkers]), completedOpening);
    const damaged = manager.propose(world(actors), completedOpening);
    expect(strong.statePatch?.strategy?.stance).toBe("pressure");
    expect(strong.statePatch?.squads?.some((squad) => squad.role === "attack")).toBe(true);
    expect(damaged.statePatch?.strategy?.stance).toBe("recover");
    expect(damaged.statePatch?.squads?.some((squad) => squad.role === "attack")).toBe(false);
  });

  it("launches a useful new mission after a prior mission with the same squad ID completed", () => {
    const initial = brain();
    const first = manager.propose(world([guard("a", "self", 0), guard("b", "self", 0), core("enemy-core")]), initial);
    const completed = first.statePatch?.squads?.find((squad) => squad.role === "attack");
    expect(completed).toBeDefined();
    const later: AiBrainStateV1 = {
      ...initial,
      squads: [{ ...completed!, actorIds: [], state: "completed" }],
      skirmish: first.statePatch!.skirmish!
    };

    const second = manager.propose(
      world([guard("a", "self", 0), guard("b", "self", 0), core("enemy-core")], 300),
      later
    );
    expect(second.intents).toContainEqual(expect.objectContaining({ kind: "attack", targetActorId: "enemy-core" }));
    expect(second.statePatch?.squads?.find((squad) => squad.role === "attack")?.lifecycle?.createdTick).toBe(300);
  });
});
