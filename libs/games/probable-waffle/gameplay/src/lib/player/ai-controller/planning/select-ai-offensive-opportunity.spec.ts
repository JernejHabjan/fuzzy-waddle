import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import { OrderType } from "@fuzzy-waddle/probable-waffle-protocol";

import { createAiTestOwnedActor } from "../testing/ai-test-fixtures";

import { guard, core, producer, world, brain, manager } from "./ai-offensive-opportunity-test-fixtures";

describe("fastest credible offense", () => {
  it("STRAT-09 chooses an observed exposed producer while a stronger enemy reserve guards its core", () => {
    const ownForce = Array.from({ length: 4 }, (_, index) => guard(`raider-${index}`, "self", 0));
    const enemyReserve = Array.from({ length: 6 }, (_, index) => guard(`reserve-${index}`, "enemy", 30 + index));
    const exposedProducer = {
      ...producer("enemy-producer"),
      logicalPosition: { status: "known" as const, value: { x: 1, y: 0, z: 0 }, observedTick: 20 }
    };
    const defendedCore = {
      ...core("enemy-core"),
      logicalPosition: { status: "known" as const, value: { x: 30, y: 0, z: 0 }, observedTick: 20 }
    };
    const result = manager.propose(world([...ownForce, exposedProducer, defendedCore, ...enemyReserve]), brain());

    expect(result.statePatch?.strategy?.assessment).toEqual(
      expect.objectContaining({
        choice: "pressure",
        targetActorId: exposedProducer.actorId,
        readyForce: 4,
        requiredForce: 3
      })
    );
    expect(result.intents).toContainEqual(
      expect.objectContaining({ kind: "attack", targetActorId: exposedProducer.actorId })
    );
  });

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

  it("keeps a visible reachable core as the objective while a force just below its local-threat requirement assembles", () => {
    const enemies = Array.from({ length: 8 }, (_, index) => guard(`enemy-guard-${index}`, "enemy", 1));
    const distantProducer = {
      ...producer("enemy-owlery"),
      logicalPosition: { status: "known" as const, value: { x: 25, y: 0, z: 0 }, observedTick: 20 }
    };
    const result = manager.propose(
      world([...Array.from({ length: 9 }, (_, index) => guard(`attacker-${index}`, "self", 0)), ...enemies,
        core("enemy-core"), distantProducer]),
      brain()
    );

    const assessment = result.statePatch?.strategy?.assessment;
    expect(assessment).toEqual(
      expect.objectContaining({
        targetActorId: "enemy-core",
        requiredForce: 13,
        reason: "assembling_compatible_force",
        selectionSource: "visible_core"
      })
    );
    expect(assessment!.readyForce).toBeLessThan(assessment!.requiredForce);
  });

  it("routes toward a remembered core using its last-known position without attacking it through fog", () => {
    const rememberedCore = {
      ...core("enemy-core"),
      visibility: "last_seen" as const,
      accessNodeId: { status: "unknown" as const, reason: "query_pending" as const }
    };
    const result = manager.propose(world([guard("a", "self", 0), guard("b", "self", 0), rememberedCore]), brain());

    expect(result.statePatch?.strategy?.assessment).toEqual(
      expect.objectContaining({
        choice: "finish",
        targetActorId: "enemy-core",
        routeDomain: "ground",
        selectionSource: "remembered_core"
      })
    );
    expect(result.intents.some((intent) => intent.kind === "attack" && intent.targetActorId === "enemy-core")).toBe(
      false
    );
    expect(result.intents).toContainEqual(
      expect.objectContaining({ kind: "scout", logicalPosition: { x: 1, y: 0, z: 0 } })
    );
  });

  it("keeps attacking a visible core instead of yielding to a remembered core scout", () => {
    const initial = brain();
    const guards = [guard("a", "self", 0), guard("b", "self", 0)];
    const rememberedCore = { ...core("sandhold"), visibility: "last_seen" as const };
    const enemyBarracks = producer("enemy-barracks");
    const enemyRange = producer("enemy-range");
    const first = manager.propose(world([...guards, rememberedCore, enemyBarracks, enemyRange]), initial);
    if (!first.statePatch?.strategy || !first.statePatch.skirmish || !first.statePatch.squads?.some((squad) => squad.role === "scout"))
      throw new Error("missing_remembered_core_scout");

    const visibleCore = core("frostforge");
    const result = manager.propose(world([...guards, rememberedCore, visibleCore, enemyBarracks, enemyRange], 120), {
      ...initial,
      squads: first.statePatch.squads,
      strategy: first.statePatch.strategy,
      skirmish: first.statePatch.skirmish
    });

    expect(result.statePatch?.strategy?.assessment).toEqual(
      expect.objectContaining({ targetActorId: visibleCore.actorId, selectionSource: "visible_core" })
    );
  });

  it("releases a retreating side-building mission for a reachable remembered core", () => {
    const initial = brain();
    const guards = [guard("a", "self", 0), guard("b", "self", 0)];
    const sideBuilding = producer("enemy-producer");
    const first = manager.propose(world([...guards, sideBuilding]), initial);
    const attack = first.statePatch?.squads?.find((squad) => squad.role === "attack");
    const strategy = first.statePatch?.strategy;
    const skirmish = first.statePatch?.skirmish;
    if (!attack?.lifecycle || !strategy || !skirmish) throw new Error("missing_attack_lifecycle");

    const rememberedCore = {
      ...core("enemy-core"),
      visibility: "last_seen" as const,
      accessNodeId: { status: "unknown" as const, reason: "query_pending" as const }
    };
    const localThreat = Array.from({ length: 4 }, (_, index) => guard(`enemy-${index}`, "enemy", 1));
    const result = manager.propose(world([...guards, sideBuilding, rememberedCore, ...localThreat], 120), {
      ...initial,
      squads: [
        {
          ...attack,
          state: "retreat",
          lifecycle: {
            ...attack.lifecycle,
            lastUsefulEffectTick: 100,
            effectDeadline: { ...attack.lifecycle.effectDeadline, dueTick: 1000 }
          }
        }
      ],
      strategy,
      skirmish
    });

    expect(result.statePatch?.strategy?.assessment).toEqual(
      expect.objectContaining({ targetActorId: "enemy-core", choice: "pressure" })
    );
    expect(result.intents).toContainEqual(
      expect.objectContaining({ kind: "scout", logicalPosition: { x: 1, y: 0, z: 0 } })
    );
    expect(result.intents.some((intent) => intent.kind === "attack" && intent.targetActorId === "enemy-core")).toBe(
      false
    );
  });

  it("promotes a remembered core over a progressing side-building objective", () => {
    const initial = brain();
    const producerTarget = producer("enemy-producer");
    const first = manager.propose(world([guard("a", "self", 0), guard("b", "self", 0), producerTarget]), initial);
    const attack = first.statePatch?.squads?.find((squad) => squad.role === "attack");
    if (!attack?.lifecycle || !first.statePatch?.strategy || !first.statePatch.skirmish)
      throw new Error("missing_attack_lifecycle");
    const activeGuards = ["a", "b"].map((id) => ({
      ...guard(id, "self", 0),
      activeOrder: {
        status: "known" as const,
        value: { orderType: OrderType.Attack, targetActorId: producerTarget.actorId },
        observedTick: 100
      }
    }));
    const rememberedCore = {
      ...core("enemy-core"),
      visibility: "last_seen" as const,
      accessNodeId: { status: "unknown" as const, reason: "query_pending" as const }
    };
    const localThreat = Array.from({ length: 4 }, (_, index) => guard(`enemy-${index}`, "enemy", 1));
    const result = manager.propose(world([...activeGuards, producerTarget, rememberedCore, ...localThreat], 120), {
      ...initial,
      squads: [
        {
          ...attack,
          state: "engage",
          lifecycle: {
            ...attack.lifecycle,
            lastUsefulEffectTick: 100,
            effectDeadline: { ...attack.lifecycle.effectDeadline, dueTick: 1000 }
          }
        }
      ],
      strategy: first.statePatch.strategy,
      skirmish: first.statePatch.skirmish
    });

    expect(result.statePatch?.strategy?.assessment?.targetActorId).toBe("enemy-core");
  });

  it("releases objective hysteresis when an active attack mission is retreating", () => {
    const guards = [guard("a", "self", 0), guard("b", "self", 0), guard("c", "self", 0)];
    const producerTarget = producer("enemy-producer");
    const initial = brain();
    const first = manager.propose(world([...guards, producerTarget]), initial);
    const attack = first.statePatch?.squads?.find((squad) => squad.role === "attack");
    const strategy = first.statePatch?.strategy;
    const skirmish = first.statePatch?.skirmish;
    if (!attack?.lifecycle || !strategy || !skirmish) throw new Error("missing_attack_lifecycle");

    const result = manager.propose(world([...guards, producerTarget, core("enemy-core")], 120), {
      ...initial,
      squads: [
        {
          ...attack,
          state: "retreat",
          lifecycle: {
            ...attack.lifecycle,
            lastUsefulEffectTick: 100,
            effectDeadline: { ...attack.lifecycle.effectDeadline, dueTick: 1000 }
          }
        }
      ],
      strategy,
      skirmish
    });

    expect(result.statePatch?.strategy?.assessment).toEqual(
      expect.objectContaining({ targetActorId: "enemy-core", choice: "finish" })
    );
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
