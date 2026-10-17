import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import { OrderType } from "@fuzzy-waddle/probable-waffle-protocol";

import { createAiTestOwnedActor } from "../testing/ai-test-fixtures";

import { guard, core, producer, world, brain, manager } from "./ai-offensive-opportunity-test-fixtures";
import { squad } from "./ai-tactics-test-fixtures";

describe("fastest credible offense", () => {
  it.each([
    { attacking: true, targetExists: true, progressing: false, expired: false, expected: "enemy-core" },
    { attacking: false, targetExists: true, progressing: false, expired: false, expected: "near-a" },
    { attacking: true, targetExists: false, progressing: false, expired: false, expected: "near-a" },
    { attacking: false, targetExists: true, progressing: true, expired: false, expected: "enemy-core" },
    { attacking: false, targetExists: true, progressing: true, expired: true, expected: "near-a" },
    { attacking: false, targetExists: false, progressing: true, expired: false, expected: "near-a" }
  ])("retains only a live attack objective: %j", ({ attacking, targetExists, progressing, expired, expected }) => {
    const guards = ["a", "b", "c"].map((id) => ({
      ...guard(id, "self", 0),
      activeOrder: {
        status: "known" as const,
        observedTick: 20,
        value: attacking ? { orderType: OrderType.Attack, targetActorId: "enemy-core" } : null
      }
    }));
    const distant = {
      ...producer("distant-producer"),
      logicalPosition: { status: "known" as const, value: { x: 40, y: 0, z: 0 }, observedTick: 20 }
    };
    const state: AiBrainStateV1 = {
      ...brain(),
      squads: [
        {
          ...squad(
            "squad:attack",
            "attack",
            guards.map((actor) => actor.actorId)
          ),
          objectiveId: "enemy-core",
          lifecycle: {
            ...squad("squad:attack", "attack", []).lifecycle!,
            lastUsefulEffectTick: progressing ? 10 : null,
            effectDeadline: {
              ...squad("squad:attack", "attack", []).lifecycle!.effectDeadline,
              dueTick: expired ? 20 : 1200
            }
          }
        }
      ]
    };
    const result = manager.propose(
      world([
        ...guards,
        ...(targetExists ? [core("enemy-core")] : []),
        producer("near-a"),
        producer("near-b"),
        distant
      ]),
      state
    );
    expect(result.statePatch?.strategy?.assessment?.targetActorId).toBe(expected);
  });

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
