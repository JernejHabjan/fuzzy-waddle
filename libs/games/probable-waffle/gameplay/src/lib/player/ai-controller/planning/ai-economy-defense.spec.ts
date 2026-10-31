import { FactionType, ObjectNames, OrderType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { createAiTestOwnedActor, unknownAiValue } from "../testing/ai-test-fixtures";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import { combatActor, fixtureState, squad, manager as tacticsManager } from "./ai-tactics-test-fixtures";
import { homeNode, enemyNode, unit, observation, profile, manager } from "./ai-skirmish-test-fixtures";
import { aiEconomySiteSafety } from "./ai-economy-site-safety";
import { proposeAiGeneralGathering } from "./ai-general-gathering-proposal";
import { AiRecoveryManager } from "./ai-recovery-manager";
import { catalog } from "./ai-macro-test-fixtures";

function source(actorId: string, x: number): AiObservedActorV1 {
  return {
    ...createAiTestOwnedActor(actorId),
    objectName: ObjectNames.Tree1,
    relation: "neutral",
    visibility: "visible",
    observedTick: 100,
    logicalPosition: { status: "known", value: { x, y: 0, z: 0 }, observedTick: 100 },
    resourceState: {
      status: "known",
      observedTick: 100,
      value: {
        resourceType: ResourceType.Wood,
        available: { status: "known", value: 100, observedTick: 100 },
        carried: unknownAiValue,
        growthReadyTick: unknownAiValue,
        serviceCapacity: { status: "known", value: 2, observedTick: 100 }
      }
    }
  };
}

describe("economic site safety and defense share actual worker exposure", () => {
  it.each([
    { attacking: true, split: false, attackMove: false },
    { attacking: true, split: true, attackMove: false },
    { attacking: true, split: true, attackMove: true },
    { attacking: false, split: false, attackMove: false }
  ])(
    "retains an ongoing attack during a route rebuild: live=$attacking, domain split=$split",
    ({ attacking, split, attackMove }) => {
      const guards = Array.from({ length: 10 }, (_, index) => ({
        ...unit(`guard-${index}`, homeNode, 0),
        activeOrder: {
          status: "known" as const,
          observedTick: 100,
          value:
            attacking && index < 8 ? { orderType: OrderType.Attack, targetActorId: attackMove ? null : "core" } : null
        }
      }));
      const core = {
        ...unit("core", enemyNode, 1),
        owner: 2,
        relation: "enemy" as const,
        visibility: "visible" as const,
        housingCost: { status: "known" as const, value: 0, observedTick: 100 },
        mainBuilding: { status: "known" as const, value: true, observedTick: 100 },
        capabilities: [{ ...guards[0]!.capabilities[0]!, family: "produce", targetDomains: [] }]
      };
      const base = observation(100, [...guards, core]);
      if (!base.map?.accessGraph) throw new Error("missing_access_graph");
      const world = {
        ...base,
        map: { ...base.map, accessGraph: { ...base.map.accessGraph, status: "pending" as const } },
        threatSummary: { ...base.threatSummary, visibleEnemyActorIds: [core.actorId] }
      };
      const mission = {
        ...squad(
          "squad:attack:primary",
          "attack",
          guards.slice(0, 8).map((a) => a.actorId)
        ),
        objectiveId: core.actorId
      };
      const missions = split
        ? [
            { ...mission, actorIds: [guards[9]!.actorId] },
            { ...mission, squadId: "squad:attack:primary:domain:ground" as const }
          ]
        : [mission];
      const result = manager.propose(world, fixtureState(missions));
      const retained = result.statePatch?.squads?.find((entry) => entry.role === "attack");
      expect(retained?.actorIds.length ?? 0).toBe(attacking ? 8 : 0);
      expect(result.intents.filter((intent) => intent.kind === "attack")).toHaveLength(0);
    }
  );

  it("reinforces defense until it can fight a strong observed raider instead of repeatedly retreating with a quarter of the army", () => {
    const main = {
      ...unit("main", homeNode, 0),
      capabilities: [],
      mainBuilding: { status: "known" as const, value: true, observedTick: 100 }
    };
    const guards = Array.from({ length: 12 }, (_, index) => ({
      ...combatActor(`guard-${index}`, "self", 0, "ground", 1000, { damage: 10 }),
      accessNodeId: { status: "known" as const, value: homeNode, observedTick: 100 }
    }));
    const raider = {
      ...combatActor("raider", "enemy", 3, "ground", 1000, { damage: 100 }),
      accessNodeId: { status: "known" as const, value: enemyNode, observedTick: 100 }
    };
    const base = observation(100, [main, ...guards, raider]);
    const result = manager.propose(
      { ...base, threatSummary: { ...base.threatSummary, visibleEnemyActorIds: [raider.actorId] } },
      createAiBrainStateV1({ playerNumber: 1, faction: FactionType.Tivara, profile, tick: 0, archetypeId: "balanced" })
    );
    const defense = result.statePatch?.squads?.find((entry) => entry.role === "defense");
    expect(defense?.actorIds.length).toBeGreaterThan(3);
    const response = tacticsManager.propose(base, fixtureState(defense ? [defense] : []));
    expect(response.statePatch?.squadUpdates?.[0]?.state).toBe("engage");
    expect(response.intents).toContainEqual(expect.objectContaining({ kind: "attack", targetActorId: raider.actorId }));
  });

  it("credits assigned defenders toward the home reserve so a viable offensive force can launch", () => {
    const main = {
      ...unit("main", homeNode, 0),
      capabilities: [],
      mainBuilding: { status: "known" as const, value: true, observedTick: 100 }
    };
    const guards = Array.from({ length: 12 }, (_, index) =>
      unit(`guard-${index.toString().padStart(2, "0")}`, homeNode, 0)
    );
    const raider = {
      ...combatActor("raider", "enemy", 1),
      accessNodeId: { status: "known" as const, value: enemyNode, observedTick: 100 }
    };
    const building = (id: string, x: number, core = false) => ({
      ...unit(id, enemyNode, x),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const,
      housingCost: { status: "known" as const, value: 0, observedTick: 100 },
      capabilities: [{ ...guards[0]!.capabilities[0]!, family: "produce", targetDomains: [] }],
      mainBuilding: { status: "known" as const, value: core, observedTick: 100 }
    });
    const enemies = [raider, building("core", 30, true), building("producer-a", 31), building("producer-b", 32)];
    const base = observation(100, [main, ...guards, ...enemies]);
    const result = manager.propose(
      { ...base, threatSummary: { ...base.threatSummary, visibleEnemyActorIds: enemies.map((a) => a.actorId) } },
      createAiBrainStateV1({ playerNumber: 1, faction: FactionType.Tivara, profile, tick: 0, archetypeId: "balanced" })
    );
    expect(result.statePatch?.squads?.find((s) => s.role === "defense")?.actorIds).toHaveLength(3);
    expect(result.statePatch?.strategy?.assessment).toMatchObject({
      targetActorId: "core",
      readyForce: 9,
      requiredForce: 8
    });
    expect(result.intents).toContainEqual(
      expect.objectContaining({
        kind: "attack",
        targetActorId: null,
        targetPosition: { x: 1, y: 0, z: 0 }
      })
    );
  });

  it("keeps defenders on their observed raider instead of replacing it with a more valuable enemy main building", () => {
    const guard = combatActor("guard", "self", 0, "ground", 1000, { damage: 100 });
    const raider = combatActor("raider", "enemy", 3, "ground", 1000, { damage: 1 });
    const building = combatActor("building", "enemy", 6, "ground", 1000, {
      damage: 0,
      mainBuilding: true,
      capabilityFamilies: ["produce", "drop_off"]
    });
    const state = fixtureState([
      { ...squad("squad:defense", "defense", [guard.actorId]), objectiveId: raider.actorId }
    ]);
    const result = tacticsManager.propose(observation(100, [guard, raider, building]), state);
    expect(result.intents.filter((intent) => intent.kind === "attack")).toContainEqual(
      expect.objectContaining({ targetActorId: raider.actorId })
    );
    expect(result.statePatch?.squadUpdates?.[0]?.objectiveId).toBe(raider.actorId);
  });

  it("ordinary and stalled-income recovery both choose the safe source rather than the first exposed ID", () => {
    const worker = {
      ...createAiTestOwnedActor("worker"),
      activeOrder: {
        status: "known" as const,
        value: null,
        observedTick: 100
      }
    };
    const enemy = { ...combatActor("enemy", "enemy", 10), observedTick: 100 };
    const base = observation(100, [worker, source("a-exposed", 11), source("z-safe", 40), enemy]);
    const world = {
      ...base,
      resources: base.resources.map((r) => ({
        ...r,
        deliveredIncomePerMinute: { status: "known" as const, value: 0, observedTick: 100 }
      })),
      threatSummary: { ...base.threatSummary, observedTick: 100, visibleEnemyActorIds: ["enemy"] }
    };
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    expect(proposeAiGeneralGathering(world, state, catalog, [worker], [], new Set(), 0)).toMatchObject({
      kind: "assign_gatherers",
      sourceActorId: "z-safe"
    });
    expect(new AiRecoveryManager(() => catalog).propose(world, state).intents).toContainEqual(
      expect.objectContaining({ kind: "assign_gatherers", sourceActorId: "z-safe" })
    );
  });
  it("defends a distant worker with a credible local force instead of leaving all guards idle at home", () => {
    const main = {
      ...unit("main", homeNode, 0),
      capabilities: [],
      mainBuilding: {
        status: "known" as const,
        value: true,
        observedTick: 100
      }
    };
    const worker = combatActor("worker", "self", 30, "ground", 1000, { capabilityFamilies: ["gather"] });
    const enemy = combatActor("enemy", "enemy", 31);
    const world = observation(100, [main, worker, enemy, unit("guard-a", homeNode, 0), unit("guard-b", homeNode, 1)]);
    const result = manager.propose(
      {
        ...world,
        threatSummary: {
          ...world.threatSummary,
          visibleEnemyActorIds: ["enemy"],
          observedTick: 100
        }
      },
      createAiBrainStateV1({ playerNumber: 1, faction: FactionType.Tivara, profile, tick: 0, archetypeId: "balanced" })
    );
    expect(result.statePatch?.squads).toContainEqual(
      expect.objectContaining({
        role: "defense",
        objectiveId: "enemy",
        actorIds: ["guard-a", "guard-b"]
      })
    );
  });

  it("rejects weapon-exposed harvest contact cells but permits safe alternatives and stale/hidden contacts", () => {
    const enemy = { ...combatActor("enemy", "enemy", 10), observedTick: 100 };
    const base = observation(100, [enemy]);
    const world = {
      ...base,
      threatSummary: { ...base.threatSummary, visibleEnemyActorIds: ["enemy"], observedTick: 100 }
    };
    expect(aiEconomySiteSafety(world).positionSafe({ x: 11, y: 0, z: 0 })).toBe(false);
    expect(aiEconomySiteSafety(world).positionSafe({ x: 40, y: 0, z: 0 })).toBe(true);
    expect(
      aiEconomySiteSafety({ ...world, actors: [{ ...enemy, visibility: "last_seen" }] }).positionSafe({
        x: 11,
        y: 0,
        z: 0
      })
    ).toBe(true);
    expect(
      aiEconomySiteSafety({ ...world, threatSummary: { ...world.threatSummary, observedTick: 99 } }).positionSafe({
        x: 11,
        y: 0,
        z: 0
      })
    ).toBe(true);
  });
});
