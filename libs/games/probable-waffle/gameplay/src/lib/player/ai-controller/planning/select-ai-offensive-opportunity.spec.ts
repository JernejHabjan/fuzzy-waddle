import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";

import { createAiTestOwnedActor } from "../testing/ai-test-fixtures";

import { guard, core, producer, world, brain, manager } from "./ai-offensive-opportunity-test-fixtures";

describe("fastest credible offense", () => {
  it("remembers a failed first mission, rebuilds briefly, then permits a stronger follow-up", () => {
    const initial = brain();
    const actors = [guard("a", "self", 0), guard("b", "self", 0), core("enemy-core")];
    const first = manager.propose(world(actors), initial);
    const launched = first.statePatch?.squads?.find((squad) => squad.role === "attack");
    if (!launched?.lifecycle || !first.statePatch?.strategy || !first.statePatch.skirmish)
      throw new Error("missing_initial_attack_mission");
    const failed: AiBrainStateV1 = {
      ...initial,
      squads: [
        {
          ...launched,
          actorIds: [],
          state: "completed",
          lifecycle: { ...launched.lifecycle, terminalReason: "no_members_released" }
        }
      ],
      strategy: first.statePatch.strategy,
      skirmish: first.statePatch.skirmish
    };

    const rebuilding = manager.propose(world(actors, 200), failed);
    expect(rebuilding.statePatch?.strategy?.assessment).toEqual(
      expect.objectContaining({
        choice: "recover",
        reason: "recent_failed_mission_rebuild",
        requiredForce: 4,
        recentFailure: expect.objectContaining({ repeatedFailures: 1, targetActorId: "enemy-core" })
      })
    );
    expect(rebuilding.intents.some((intent) => intent.kind === "attack")).toBe(false);

    if (!rebuilding.statePatch?.strategy || !rebuilding.statePatch.skirmish)
      throw new Error("missing_recovery_projection");
    const renewed = manager.propose(world([...actors, guard("c", "self", 0), guard("d", "self", 0)], 400), {
      ...failed,
      squads: [],
      strategy: rebuilding.statePatch.strategy,
      skirmish: rebuilding.statePatch.skirmish
    });
    expect(renewed.statePatch?.strategy?.assessment).toEqual(
      expect.objectContaining({ choice: "finish", requiredForce: 4 })
    );
    expect(renewed.intents).toContainEqual(expect.objectContaining({ kind: "attack", targetActorId: "enemy-core" }));
  });

  it("attributes a failed mission to its saved objective after the current assessment changes target", () => {
    const initial = brain();
    const actors = [guard("a", "self", 0), guard("b", "self", 0), core("enemy-core")];
    const first = manager.propose(world(actors), initial);
    const launched = first.statePatch?.squads?.find((squad) => squad.role === "attack");
    const strategy = first.statePatch?.strategy;
    if (!launched?.lifecycle || !strategy?.assessment) throw new Error("missing_initial_attack_mission");
    const state: AiBrainStateV1 = {
      ...initial,
      squads: [
        {
          ...launched,
          actorIds: [],
          state: "completed",
          lifecycle: { ...launched.lifecycle, terminalReason: "no_members_released" }
        }
      ],
      strategy: { ...strategy, assessment: { ...strategy.assessment, targetActorId: "other-core" } }
    };

    const result = manager.propose(world(actors, 200), state);
    expect(result.statePatch?.strategy?.assessment?.recentFailure?.targetActorId).toBe("enemy-core");
  });

  it("finishes an exposed reachable core with a small compatible force before the old six-unit gate", () => {
    const result = manager.propose(world([guard("a", "self", 0), guard("b", "self", 0), core("enemy-core")]), brain());

    expect(result.statePatch?.strategy?.stance).toBe("finish");
    expect(result.statePatch?.strategy?.assessment).toEqual(
      expect.objectContaining({
        choice: "finish",
        targetActorId: "enemy-core",
        readyForce: 2,
        requiredForce: 2
      })
    );
    expect(result.intents).toContainEqual(expect.objectContaining({ kind: "attack", targetActorId: "enemy-core" }));
  });

  it("does not treat a visibly developed base as an exposed two-unit finish, even at the assembly timeout", () => {
    const structures = [core("enemy-core"), producer("barracks"), producer("range")];
    const smallForce = [guard("a", "self", 0), guard("b", "self", 0)];
    const initial = brain();
    const first = manager.propose(world([...smallForce, ...structures]), initial);
    expect(first.statePatch?.strategy?.assessment).toEqual(
      expect.objectContaining({ reason: "assembling_against_developed_base", requiredForce: 8 })
    );
    expect(first.statePatch?.skirmish?.timeline.some((event) => event.detail.startsWith("launch:"))).toBe(false);

    const state: AiBrainStateV1 = {
      ...initial,
      squads: first.statePatch!.squads!,
      skirmish: first.statePatch!.skirmish!
    };
    const later = manager.propose(world([...smallForce, ...structures], 1300), state);
    expect(later.statePatch?.skirmish?.timeline.some((event) => event.detail.startsWith("launch:"))).toBe(false);
  });

  it("does not launch a tiny raid at a producer inside an observed production cluster", () => {
    const structures = [producer("barracks"), producer("range"), producer("forge")];
    const result = manager.propose(world([guard("a", "self", 0), guard("b", "self", 0), ...structures]), brain());

    expect(result.statePatch?.strategy?.assessment).toEqual(
      expect.objectContaining({ reason: "assembling_against_developed_base", requiredForce: 8 })
    );
    expect(result.statePatch?.skirmish?.timeline.some((event) => event.detail.startsWith("launch:"))).toBe(false);
  });

  it("recovers a damaged workforce before assembling a non-credible attack", () => {
    const workers = Array.from({ length: 3 }, (_, index) => ({
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
    const initial = brain();
    const result = manager.propose(
      world([
        ...workers,
        guard("a", "self", 0),
        guard("b", "self", 0),
        core("enemy-core"),
        producer("barracks"),
        producer("range")
      ]),
      { ...initial, opening: { ...initial.opening, plan: { ...initial.opening.plan, lifecycle: "completed" } } }
    );

    expect(result.statePatch?.strategy?.assessment).toEqual(
      expect.objectContaining({ choice: "recover", reason: "workforce_below_recovery_floor" })
    );
    expect(result.intents.some((intent) => intent.kind === "attack")).toBe(false);
  });

  it("does not abandon an immediate exposed-core finish just because the workforce is damaged", () => {
    const initial = brain();
    const result = manager.propose(world([guard("a", "self", 0), guard("b", "self", 0), core("enemy-core")]), {
      ...initial,
      opening: { ...initial.opening, plan: { ...initial.opening.plan, lifecycle: "completed" } }
    });

    expect(result.statePatch?.strategy?.assessment?.choice).toBe("finish");
    expect(result.intents).toContainEqual(expect.objectContaining({ kind: "attack", targetActorId: "enemy-core" }));
  });
});
