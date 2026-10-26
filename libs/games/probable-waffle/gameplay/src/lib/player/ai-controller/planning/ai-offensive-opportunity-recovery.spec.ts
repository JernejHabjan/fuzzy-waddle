import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import { OrderType } from "@fuzzy-waddle/probable-waffle-protocol";

import { createAiTestOwnedActor } from "../testing/ai-test-fixtures";

import { guard, core, producer, world, brain, manager } from "./ai-offensive-opportunity-test-fixtures";
import { squad } from "./ai-tactics-test-fixtures";

describe("fastest credible offense", () => {
  it("keeps progressing mission members through a native job gap instead of diverting them into home reserve", () => {
    const guards = Array.from({ length: 8 }, (_, i) => ({
      ...guard(`guard-${i}`, "self", 0),
      activeOrder: { status: "known" as const, value: null, observedTick: 20 }
    }));
    const mission = {
      ...squad(
        "squad:attack",
        "attack",
        guards.map((actor) => actor.actorId)
      ),
      objectiveId: "enemy-core",
      lifecycle: {
        ...squad("squad:attack", "attack", []).lifecycle!,
        lastUsefulEffectTick: 10,
        effectDeadline: { ...squad("squad:attack", "attack", []).lifecycle!.effectDeadline, dueTick: 1200 }
      }
    };
    const result = manager.propose(world([...guards, core("enemy-core")]), { ...brain(), squads: [mission] });
    expect(
      result.statePatch?.squads?.filter((entry) => entry.role === "reserve").flatMap((entry) => entry.actorIds)
    ).toEqual([]);
    expect(result.statePatch?.squads?.find((entry) => entry.role === "attack")?.actorIds).toHaveLength(8);
  });
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

  it("abandons an underpowered working objective when another observed objective is already feasible", () => {
    const currentTarget = {
      ...producer("working-producer"),
      logicalPosition: { status: "known" as const, value: { x: 25, y: 0, z: 0 }, observedTick: 120 }
    };
    const feasibleTarget = {
      ...producer("feasible-producer"),
      logicalPosition: { status: "known" as const, value: { x: 0, y: 0, z: 0 }, observedTick: 120 }
    };
    const attackers = Array.from({ length: 4 }, (_, index) => ({
      ...guard(`attacker-${index}`, "self", 0),
      activeOrder: {
        status: "known" as const,
        observedTick: 120,
        value: null
      }
    }));
    const defenders = Array.from({ length: 6 }, (_, index) => guard(`defender-${index}`, "enemy", 20 + index));
    const attackSquad = {
      ...squad("squad:attack", "attack", attackers.map((actor) => actor.actorId)),
      objectiveId: currentTarget.actorId,
      state: "advance" as const
    };

    const result = manager.propose(
      world([...attackers, currentTarget, feasibleTarget, ...defenders], 120),
      { ...brain(), squads: [attackSquad] }
    );

    expect(result.statePatch?.strategy?.assessment).toEqual(
      expect.objectContaining({
        choice: "pressure",
        targetActorId: feasibleTarget.actorId,
        readyForce: 4,
        requiredForce: 3
      })
    );
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
