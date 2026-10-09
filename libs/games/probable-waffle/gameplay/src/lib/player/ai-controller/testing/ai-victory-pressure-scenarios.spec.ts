import { FactionType, ObjectNames, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { digestCanonicalAiValue } from "../brain/canonical-ai-serialization";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { buildAiAccessGraphV1 } from "../planning/ai-access-graph-v1";
import { AiSkirmishManager } from "../planning/ai-skirmish-manager";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "./ai-test-fixtures";

const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
const catalog: AiCapabilityCatalogV1 = {
  schemaVersion: 1 as const,
  generation: 1,
  unsupported: [],
  entries: [
    {
      capabilityId: "guard",
      family: "military",
      sourceObjectName: ObjectNames.TivaraMacemanMale,
      effectiveLevel: 1,
      movementDomains: ["ground" as const],
      targetDomains: ["ground" as const],
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
const manager = new AiSkirmishManager(profile, () => catalog);
const connected = buildAiAccessGraphV1({
  generation: 1,
  staticRevision: 1,
  dynamicRevision: 1,
  threatRevision: 0,
  builtTick: 0,
  continuationCursor: 0,
  includeAirRegion: false,
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
      clearance: 2
    }
  ]
});
const sourceNode = connected.groundNodeByTileKey.get("0,0")!;
const targetNode = connected.groundNodeByTileKey.get("1,0")!;

function combatActor(actorId: string, relation: "self" | "enemy", x: number): AiObservedActorV1 {
  return {
    ...createAiTestOwnedActor(actorId),
    objectName: ObjectNames.TivaraMacemanMale,
    owner: relation === "self" ? 1 : 2,
    relation,
    visibility: relation === "self" ? "owned" : "visible",
    // Counterforce is near the offensive objective, outside the separate home-defense radius.
    logicalPosition: { status: "known", value: { x: x * 20, y: 0, z: 0 }, observedTick: 200 },
    accessNodeId: { status: "known", value: x === 0 ? sourceNode : targetNode, observedTick: 200 },
    capabilities: [
      {
        id: `${actorId}:attack`,
        family: "military",
        level: 1,
        domains: ["ground"],
        targetDomains: ["ground"],
        capacity: { status: "known", value: 0, observedTick: 200 }
      }
    ],
    containedInActorId: null
  };
}

function strategyWorld(forceCount: number, workerCount: number, defenderCount: number): AiObservationV1 {
  const guards = Array.from({ length: forceCount }, (_, index) => combatActor(`guard-${index}`, "self", 0));
  const workers = Array.from({ length: workerCount }, (_, index) => ({
    ...combatActor(`worker-${index}`, "self", 0),
    objectName: ObjectNames.TivaraWorker,
    capabilities: [
      {
        id: `worker-${index}:gather`,
        family: "gather",
        level: 1,
        domains: ["ground" as const],
        targetDomains: [],
        capacity: { status: "known" as const, value: 1, observedTick: 200 }
      }
    ]
  }));
  const core: AiObservedActorV1 = {
    ...combatActor("enemy-core", "enemy", 1),
    capabilities: [],
    housingCost: { status: "known", value: 0, observedTick: 200 },
    mainBuilding: { status: "known", value: true, observedTick: 200 }
  };
  const defenders = Array.from({ length: defenderCount }, (_, index) =>
    combatActor(`enemy-defender-${index}`, "enemy", 1)
  );
  const base = createAiTestObservation();
  return {
    ...base,
    tick: 200,
    actors: [...guards, ...workers, core, ...defenders],
    threatSummary: {
      ...base.threatSummary,
      observedTick: 200,
      visibleEnemyActorIds: [core.actorId, ...defenders.map((defender) => defender.actorId)]
    },
    map: {
      bounds: { status: "known", value: { width: 2, height: 1 }, observedTick: 200 },
      staticRevision: 1,
      frontierAccessNodeIds: [],
      scoutCoverageAccessNodeIds: [],
      dynamicObstacleActorIds: [],
      regionGeneration: { generation: 1, status: "ready", continuationCursor: 0 },
      accessGraph: connected.graph
    }
  };
}

function strategyProposal(forceCount: number, workerCount: number, defenderCount: number) {
  const initial = createAiBrainStateV1({
    playerNumber: 1,
    faction: FactionType.Tivara,
    profile,
    tick: 0,
    archetypeId: "balanced"
  });
  return manager.propose(strategyWorld(forceCount, workerCount, defenderCount), {
    ...initial,
    opening: { ...initial.opening, plan: { ...initial.opening.plan, lifecycle: "completed" } }
  });
}

describe("STRAT-05 visible counterforce interrupts an unsafe finish", () => {
  it("forms instead of launching into a newly visible superior guard force", () => {
    const clear = strategyProposal(4, 8, 0);
    const guarded = strategyProposal(4, 8, 4);
    expect(clear.statePatch?.strategy?.assessment?.choice).toBe("finish");
    expect(clear.intents.some((intent) => intent.kind === "attack" && intent.targetActorId === "enemy-core")).toBe(
      true
    );
    expect(guarded.statePatch?.strategy?.assessment).toEqual(
      expect.objectContaining({
        targetActorId: "enemy-core",
        readyForce: 4,
        visibleThreatCount: 4
      })
    );
    expect(guarded.statePatch?.squads?.find((squad) => squad.role === "attack")?.state).toBe("forming");
    expect(guarded.intents.some((intent) => intent.kind === "attack" && intent.targetActorId === "enemy-core")).toBe(
      false
    );
    expect(new Set(Array.from({ length: 3 }, () => digestCanonicalAiValue(strategyProposal(4, 8, 4)))).size).toBe(1);
  });
});

describe("STRAT-06 equal-tick economy versus recovery policy", () => {
  it("presses a ready force but recovers a depleted workforce without a time-only phase switch", () => {
    const strong = strategyProposal(4, 8, 0);
    const damaged = strategyProposal(1, 1, 0);
    expect(strong.statePatch?.strategy?.assessment?.choice).toBe("finish");
    expect(damaged.statePatch?.strategy?.assessment).toEqual(
      expect.objectContaining({
        choice: "recover",
        reason: "workforce_below_recovery_floor",
        targetActorId: "enemy-core"
      })
    );
    expect(damaged.intents.some((intent) => intent.kind === "attack")).toBe(false);
    expect(new Set(Array.from({ length: 3 }, () => digestCanonicalAiValue(strategyProposal(1, 1, 0)))).size).toBe(1);
  });
});
