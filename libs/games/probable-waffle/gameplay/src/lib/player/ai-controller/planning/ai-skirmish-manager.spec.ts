import {
  FactionType,
  ObjectNames,
  OrderType,
  ProbableWaffleAiDifficulty,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservedActorV1, AiObservationV1 } from "../contracts/ai-observation-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { buildAiAccessGraphV1 } from "./ai-access-graph-v1";
import {
  AI_SKIRMISH_ASSEMBLY_TIMEOUT_TICKS,
  AI_CONCESSION_HOPELESS_TICKS,
  AiSkirmishManager
} from "./ai-skirmish-manager";

const graphInput = buildAiAccessGraphV1({
  generation: 1,
  staticRevision: 1,
  dynamicRevision: 1,
  threatRevision: 0,
  builtTick: 0,
  continuationCursor: 0,
  includeAirRegion: true,
  cells: [
    {
      x: 0,
      y: 0,
      ground: true,
      water: false,
      elevation: 0,
      groundNeighborKeys: ["1,0"],
      knowledge: "known_static",
      clearance: 2
    },
    {
      x: 1,
      y: 0,
      ground: true,
      water: false,
      elevation: 0,
      groundNeighborKeys: ["0,0"],
      knowledge: "known_static",
      clearance: 1
    }
  ]
});
const homeNode = graphInput.groundNodeByTileKey.get("0,0")!;
const enemyNode = graphInput.groundNodeByTileKey.get("1,0")!;

const catalog: AiCapabilityCatalogV1 = {
  schemaVersion: 1,
  generation: 1,
  unsupported: [],
  entries: [
    {
      capabilityId: "guard",
      family: "military",
      sourceObjectName: ObjectNames.TivaraMacemanMale,
      effectiveLevel: 1,
      movementDomains: ["ground"],
      targetDomains: ["ground"],
      produces: [],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: 1,
      cargoCapacity: null
    }
  ]
};

function unit(actorId: string, accessNodeId: typeof homeNode, x: number): AiObservedActorV1 {
  return {
    ...createAiTestOwnedActor(actorId),
    objectName: ObjectNames.TivaraMacemanMale,
    logicalPosition: { status: "known", value: { x, y: 0, z: 0 }, observedTick: 0 },
    accessNodeId: { status: "known", value: accessNodeId, observedTick: 0 },
    housingCost: { status: "known", value: 1, observedTick: 0 },
    capabilities: [
      {
        id: `${actorId}:attack`,
        family: "military",
        level: 1,
        domains: ["ground"],
        targetDomains: ["ground"],
        capacity: { status: "known", value: 0, observedTick: 0 }
      }
    ],
    containedInActorId: null
  };
}

function observation(
  tick: number,
  actors: readonly AiObservedActorV1[],
  frontiers: readonly (typeof homeNode)[] = [enemyNode],
  coverage: readonly (typeof homeNode)[] = []
): AiObservationV1 {
  return {
    ...createAiTestObservation(),
    generation: 1,
    tick,
    actors,
    map: {
      bounds: { status: "known", value: { width: 2, height: 1 }, observedTick: tick },
      staticRevision: 1,
      frontierAccessNodeIds: frontiers,
      scoutCoverageAccessNodeIds: coverage,
      dynamicObstacleActorIds: [],
      regionGeneration: { generation: 1, status: "ready", continuationCursor: 0 },
      accessGraph: graphInput.graph
    }
  };
}

describe("AiSkirmishManager", () => {
  const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
  const manager = new AiSkirmishManager(profile, () => catalog);

  it("asks a reachable question and sends a legal scout instead of treating coverage as success", () => {
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const proposal = manager.propose(observation(20, [unit("guard-1", homeNode, 0)]), state);

    expect(proposal.intents).toContainEqual(
      expect.objectContaining({ kind: "scout", logicalPosition: { x: 1, y: 0, z: 0 } })
    );
    expect(proposal.statePatch?.knowledge?.questions).toContainEqual(
      expect.objectContaining({ kind: `safe_route:${enemyNode}`, state: "open" })
    );
  });

  it("advances an existing scout to the next uncovered frontier and closes the prior question", () => {
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const first = manager.propose(observation(20, [unit("guard-1", homeNode, 0)]), state);
    const priorScout = first.statePatch!.squads!.find((squad) => squad.role === "scout")!;
    const continued = manager.propose(
      observation(40, [unit("guard-1", enemyNode, 1)], [enemyNode, homeNode], [enemyNode]),
      {
        ...state,
        knowledge: first.statePatch!.knowledge!,
        squads: [{ ...priorScout, tactics: {} as never }]
      }
    );

    expect(continued.statePatch?.knowledge?.questions).toContainEqual(
      expect.objectContaining({ kind: `safe_route:${enemyNode}`, state: "answered" })
    );
    expect(continued.intents).toContainEqual(
      expect.objectContaining({ kind: "scout", logicalPosition: { x: 0, y: 0, z: 0 } })
    );
    expect(continued.statePatch?.squads?.find((squad) => squad.role === "scout")?.objectiveId).toBe(
      `question:frontier:${homeNode}`
    );
  });

  it("keeps a repeated visible contact as one incident rather than inflating enemy confidence", () => {
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const enemy = {
      ...unit("enemy-1", enemyNode, 30),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const
    };
    const first = manager.propose(observation(20, [unit("guard-1", homeNode, 0), enemy]), state);
    const second = manager.propose(observation(40, [unit("guard-1", homeNode, 0), enemy]), {
      ...state,
      skirmish: first.statePatch!.skirmish!
    });

    expect(second.statePatch?.skirmish?.incidents).toHaveLength(1);
    expect(second.statePatch?.skirmish?.incidents[0]).toEqual(
      expect.objectContaining({ confidencePermille: 1000, hostileActorIds: ["enemy-1"] })
    );
    expect(second.statePatch?.skirmish?.timeline.filter((event) => event.kind === "threat")).toHaveLength(1);
  });

  it("retires an old last-seen objective and sends a bounded scout to the next frontier", () => {
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const staleEnemy = {
      ...unit("stale-enemy", enemyNode, 30),
      owner: 2,
      relation: "enemy" as const,
      visibility: "last_seen" as const,
      observedTick: 0
    };

    const proposal = manager.propose(
      observation(AI_SKIRMISH_ASSEMBLY_TIMEOUT_TICKS + 1, [
        unit("guard-1", homeNode, 0),
        unit("guard-2", homeNode, 0),
        staleEnemy
      ]),
      state
    );

    expect(proposal.statePatch?.squads?.some((squad) => squad.role === "attack")).toBe(false);
    expect(proposal.statePatch?.squads?.find((squad) => squad.role === "scout")?.actorIds).toEqual([
      "guard-1",
      "guard-2"
    ]);
    expect(proposal.intents).toContainEqual(expect.objectContaining({ kind: "scout" }));
  });

  it("anchors local defense to the main building instead of a distant roaming combat unit", () => {
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const main = {
      ...unit("main", homeNode, 0),
      housingCost: { status: "known" as const, value: 0, observedTick: 0 },
      capabilities: [],
      mainBuilding: { status: "known" as const, value: true, observedTick: 0 }
    };
    const raider = unit("raider", enemyNode, 30);
    const enemy = {
      ...unit("enemy", enemyNode, 31),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const
    };

    const proposal = manager.propose(observation(20, [raider, main, enemy]), state);

    expect(proposal.statePatch?.squads?.some((squad) => squad.role === "defense")).toBe(false);
  });

  it("forms a defense squad for a visible raider explicitly ordered against a protected base", () => {
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const main = {
      ...unit("main", homeNode, 0),
      housingCost: { status: "known" as const, value: 0, observedTick: 0 },
      capabilities: [],
      mainBuilding: { status: "known" as const, value: true, observedTick: 0 }
    };
    const guard = unit("guard", homeNode, 0);
    const raider = {
      ...unit("raider", enemyNode, 30),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const,
      activeOrder: {
        status: "known" as const,
        value: { orderType: OrderType.Attack, targetActorId: main.actorId },
        observedTick: 20
      }
    };

    const proposal = manager.propose(observation(20, [main, guard, raider]), state);

    expect(proposal.statePatch?.squads).toContainEqual(
      expect.objectContaining({ role: "defense", objectiveId: "raider", actorIds: ["guard"] })
    );
  });

  it("does not classify a nearby static enemy building as a home raid", () => {
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const main = {
      ...unit("main", homeNode, 0),
      housingCost: { status: "known" as const, value: 0, observedTick: 0 },
      capabilities: [],
      mainBuilding: { status: "known" as const, value: true, observedTick: 0 }
    };
    const guard = unit("guard", homeNode, 0);
    const enemyBuilding = {
      ...unit("enemy-building", enemyNode, 5),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const,
      housingCost: { status: "known" as const, value: 0, observedTick: 0 },
      capabilities: []
    };

    const proposal = manager.propose(observation(20, [main, guard, enemyBuilding]), state);

    expect(proposal.statePatch?.squads?.some((candidate) => candidate.role === "defense")).toBe(false);
    expect(proposal.statePatch?.strategy?.stance).toBe("pressure");
  });

  it("keeps armed gatherers out of standing attack and scout squads", () => {
    const workerCatalog: AiCapabilityCatalogV1 = {
      ...catalog,
      entries: [
        ...catalog.entries,
        {
          ...catalog.entries[0]!,
          capabilityId: "worker",
          sourceObjectName: ObjectNames.TivaraWorker,
          gathers: [ResourceType.Wood]
        }
      ]
    };
    const workerManager = new AiSkirmishManager(profile, () => workerCatalog);
    const initial = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const worker = { ...unit("worker", homeNode, 0), objectName: ObjectNames.TivaraWorker };
    const enemy = {
      ...unit("enemy", enemyNode, 1),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const
    };
    const proposal = workerManager.propose(observation(20, [worker, enemy]), initial);

    expect(proposal.statePatch?.squads).toEqual([]);
    expect(proposal.intents.some((intent) => "actorIds" in intent && intent.actorIds.includes("worker"))).toBe(false);
    expect(proposal.reasons).toContain("combat:0");
  });

  it("launches a bounded smaller mission after an impossible full assembly wait", () => {
    const initial = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const enemy = {
      ...unit("enemy-1", enemyNode, 30),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const
    };
    const state = {
      ...initial,
      squads: [
        {
          squadId: "squad:attack:primary" as const,
          role: "attack" as const,
          domain: "ground" as const,
          actorIds: ["guard-1"],
          objectiveId: "enemy-1",
          state: "forming" as const,
          lifecycle: {
            targetPlayerNumber: 2,
            targetRegionId: enemyNode,
            protectedBaseId: null,
            rallyNodeId: homeNode,
            retreatNodeId: homeNode,
            createdTick: 0,
            assemblyDeadline: {
              clock: "simulation" as const,
              unit: "tick" as const,
              persistence: "save" as const,
              dueTick: AI_SKIRMISH_ASSEMBLY_TIMEOUT_TICKS
            },
            effectDeadline: {
              clock: "simulation" as const,
              unit: "tick" as const,
              persistence: "save" as const,
              dueTick: 2400
            },
            lastUsefulEffectTick: null,
            recoveryAttempt: 0,
            terminalReason: null
          },
          tactics: {} as never
        }
      ]
    };
    const proposal = manager.propose(
      observation(AI_SKIRMISH_ASSEMBLY_TIMEOUT_TICKS, [unit("guard-1", homeNode, 0), enemy]),
      state
    );

    expect(proposal.intents).toContainEqual(
      expect.objectContaining({ kind: "attack", actorIds: ["guard-1"], targetActorId: "enemy-1" })
    );
    expect(proposal.statePatch?.squads?.find((squad) => squad.role === "attack")?.state).toBe("moving");
    expect(proposal.statePatch?.skirmish?.timeline).toContainEqual(
      expect.objectContaining({ subjectId: "squad:attack:primary", detail: "launch:direct" })
    );

    const repeated = manager.propose(
      observation(AI_SKIRMISH_ASSEMBLY_TIMEOUT_TICKS + 20, [unit("guard-1", homeNode, 0), enemy]),
      {
        ...state,
        skirmish: proposal.statePatch!.skirmish!,
        squads: proposal.statePatch!.squads!
      }
    );
    expect(repeated.intents.some((intent) => intent.kind === "attack")).toBe(false);
    expect(repeated.statePatch?.skirmish?.timeline.filter((event) => event.detail.startsWith("launch:"))).toHaveLength(
      1
    );
  });

  it("keeps the chosen opponent focus and does not recall a defender for a distant bait contact", () => {
    const initial = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const focused = {
      ...unit("enemy-focus", enemyNode, 30),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const
    };
    const bait = {
      ...unit("enemy-bait", enemyNode, 200),
      owner: 3,
      relation: "enemy" as const,
      visibility: "visible" as const
    };
    const state = {
      ...initial,
      squads: [
        {
          squadId: "squad:attack:primary" as const,
          role: "attack" as const,
          domain: "ground" as const,
          actorIds: ["guard-1"],
          objectiveId: "enemy-focus",
          state: "forming" as const,
          lifecycle: {
            targetPlayerNumber: 2,
            targetRegionId: enemyNode,
            protectedBaseId: null,
            rallyNodeId: homeNode,
            retreatNodeId: homeNode,
            createdTick: 0,
            assemblyDeadline: {
              clock: "simulation" as const,
              unit: "tick" as const,
              persistence: "save" as const,
              dueTick: 1200
            },
            effectDeadline: {
              clock: "simulation" as const,
              unit: "tick" as const,
              persistence: "save" as const,
              dueTick: 2400
            },
            lastUsefulEffectTick: null,
            recoveryAttempt: 0,
            terminalReason: null
          }
        }
      ]
    };
    const proposal = manager.propose(observation(20, [unit("guard-1", homeNode, 0), bait, focused]), state);

    expect(proposal.statePatch?.squads?.find((squad) => squad.role === "attack")?.objectiveId).toBe("enemy-focus");
    expect(proposal.statePatch?.squads?.some((squad) => squad.role === "defense")).toBe(false);
  });

  it("requires sustained hopelessness, then emits exactly one authoritative concession intent", () => {
    const initial = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const state = {
      ...initial,
      skirmish: {
        ...initial.skirmish,
        mode: { ...initial.skirmish.mode, state: "hopeless" as const, hopelessSinceTick: 0 }
      }
    };
    const proposal = manager.propose(observation(AI_CONCESSION_HOPELESS_TICKS, [], []), state);

    expect(proposal.intents).toContainEqual(
      expect.objectContaining({ kind: "concede", reason: "sustained_no_recoverable_route" })
    );
    expect(proposal.statePatch?.skirmish?.mode.concessionIntentId).toEqual(expect.any(String));
  });
});
