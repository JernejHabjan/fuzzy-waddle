import { FactionType, ObjectNames, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservedActorV1, AiObservationV1 } from "../contracts/ai-observation-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createStage2Observation, createStage2OwnedActor } from "../testing/ai-stage-2-test-fixtures";
import { buildAiAccessGraphV1 } from "./ai-access-graph-v1";
import { AI_STAGE_9_ASSEMBLY_TIMEOUT_TICKS, AI_STAGE_9_CONCESSION_HOPELESS_TICKS, AiStage9SkirmishManagerV1 } from "./ai-stage-9-skirmish-manager";

const graphInput = buildAiAccessGraphV1({
  generation: 1,
  staticRevision: 1,
  dynamicRevision: 1,
  threatRevision: 0,
  builtTick: 0,
  continuationCursor: 0,
  includeAirRegion: true,
  cells: [
    { x: 0, y: 0, ground: true, water: false, elevation: 0, groundNeighborKeys: ["1,0"], knowledge: "known_static", clearance: 2 },
    { x: 1, y: 0, ground: true, water: false, elevation: 0, groundNeighborKeys: ["0,0"], knowledge: "known_static", clearance: 2 }
  ]
});
const homeNode = graphInput.groundNodeByTileKey.get("0,0")!;
const enemyNode = graphInput.groundNodeByTileKey.get("1,0")!;

const catalog: AiCapabilityCatalogV1 = {
  schemaVersion: 1,
  generation: 1,
  unsupported: [],
  entries: [{
    capabilityId: "guard", family: "military", sourceObjectName: ObjectNames.TivaraMacemanMale, effectiveLevel: 1,
    movementDomains: ["ground"], targetDomains: ["ground"], produces: [], constructs: [], researches: [], gathers: [],
    housingCapacity: null, housingCost: 1, cargoCapacity: null
  }]
};

function unit(actorId: string, accessNodeId: typeof homeNode, x: number): AiObservedActorV1 {
  return {
    ...createStage2OwnedActor(actorId),
    objectName: ObjectNames.TivaraMacemanMale,
    logicalPosition: { status: "known", value: { x, y: 0, z: 0 }, observedTick: 0 },
    accessNodeId: { status: "known", value: accessNodeId, observedTick: 0 },
    housingCost: { status: "known", value: 1, observedTick: 0 },
    capabilities: [{ id: `${actorId}:attack`, family: "military", level: 1, domains: ["ground"], targetDomains: ["ground"], capacity: { status: "known", value: 0, observedTick: 0 } }],
    containedInActorId: null
  };
}

function observation(tick: number, actors: readonly AiObservedActorV1[], frontiers: readonly typeof homeNode[] = [enemyNode]): AiObservationV1 {
  return {
    ...createStage2Observation(),
    generation: 1,
    tick,
    actors,
    map: {
      bounds: { status: "known", value: { width: 2, height: 1 }, observedTick: tick },
      staticRevision: 1,
      frontierAccessNodeIds: frontiers,
      scoutCoverageAccessNodeIds: [],
      dynamicObstacleActorIds: [],
      regionGeneration: { generation: 1, status: "ready", continuationCursor: 0 },
      accessGraph: graphInput.graph
    }
  };
}

describe("AiStage9SkirmishManagerV1", () => {
  const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
  const manager = new AiStage9SkirmishManagerV1(profile, () => catalog);

  it("asks a reachable question and sends a legal scout instead of treating coverage as success", () => {
    const state = createAiBrainStateV1({ playerNumber: 1, faction: FactionType.Tivara, profile, tick: 0, archetypeId: "balanced" });
    const proposal = manager.propose(observation(20, [unit("guard-1", homeNode, 0)]), state);

    expect(proposal.intents).toContainEqual(expect.objectContaining({ kind: "scout", logicalPosition: { x: 1, y: 0, z: 0 } }));
    expect(proposal.statePatch?.knowledge?.questions).toContainEqual(expect.objectContaining({ kind: `safe_route:${enemyNode}`, state: "open" }));
  });

  it("keeps a repeated visible contact as one incident rather than inflating enemy confidence", () => {
    const state = createAiBrainStateV1({ playerNumber: 1, faction: FactionType.Tivara, profile, tick: 0, archetypeId: "balanced" });
    const enemy = { ...unit("enemy-1", enemyNode, 1), owner: 2, relation: "enemy" as const, visibility: "visible" as const };
    const first = manager.propose(observation(20, [unit("guard-1", homeNode, 0), enemy]), state);
    const second = manager.propose(observation(40, [unit("guard-1", homeNode, 0), enemy]), { ...state, skirmish: first.statePatch!.skirmish! });

    expect(second.statePatch?.skirmish?.incidents).toHaveLength(1);
    expect(second.statePatch?.skirmish?.incidents[0]).toEqual(expect.objectContaining({ confidencePermille: 1000, hostileActorIds: ["enemy-1"] }));
  });

  it("launches a bounded smaller mission after an impossible full assembly wait", () => {
    const initial = createAiBrainStateV1({ playerNumber: 1, faction: FactionType.Tivara, profile, tick: 0, archetypeId: "balanced" });
    const enemy = { ...unit("enemy-1", enemyNode, 1), owner: 2, relation: "enemy" as const, visibility: "visible" as const };
    const state = {
      ...initial,
      squads: [{
        squadId: "squad:attack:primary" as const, role: "attack" as const, domain: "ground" as const, actorIds: ["guard-1"], objectiveId: "enemy-1", state: "forming" as const,
        lifecycle: { targetPlayerNumber: 2, targetRegionId: enemyNode, protectedBaseId: null, rallyNodeId: homeNode, retreatNodeId: homeNode, createdTick: 0, assemblyDeadline: { clock: "simulation" as const, unit: "tick" as const, persistence: "save" as const, dueTick: AI_STAGE_9_ASSEMBLY_TIMEOUT_TICKS }, effectDeadline: { clock: "simulation" as const, unit: "tick" as const, persistence: "save" as const, dueTick: 2400 }, lastUsefulEffectTick: null, recoveryAttempt: 0, terminalReason: null }
      }]
    };
    const proposal = manager.propose(observation(AI_STAGE_9_ASSEMBLY_TIMEOUT_TICKS, [unit("guard-1", homeNode, 0), enemy]), state);

    expect(proposal.intents).toContainEqual(expect.objectContaining({ kind: "attack", actorIds: ["guard-1"], targetActorId: "enemy-1" }));
    expect(proposal.statePatch?.squads?.find((squad) => squad.role === "attack")?.state).toBe("moving");
  });

  it("keeps the chosen opponent focus and does not recall a defender for a distant bait contact", () => {
    const initial = createAiBrainStateV1({ playerNumber: 1, faction: FactionType.Tivara, profile, tick: 0, archetypeId: "balanced" });
    const focused = { ...unit("enemy-focus", enemyNode, 30), owner: 2, relation: "enemy" as const, visibility: "visible" as const };
    const bait = { ...unit("enemy-bait", enemyNode, 200), owner: 3, relation: "enemy" as const, visibility: "visible" as const };
    const state = {
      ...initial,
      squads: [{
        squadId: "squad:attack:primary" as const, role: "attack" as const, domain: "ground" as const, actorIds: ["guard-1"], objectiveId: "enemy-focus", state: "forming" as const,
        lifecycle: { targetPlayerNumber: 2, targetRegionId: enemyNode, protectedBaseId: null, rallyNodeId: homeNode, retreatNodeId: homeNode, createdTick: 0, assemblyDeadline: { clock: "simulation" as const, unit: "tick" as const, persistence: "save" as const, dueTick: 1200 }, effectDeadline: { clock: "simulation" as const, unit: "tick" as const, persistence: "save" as const, dueTick: 2400 }, lastUsefulEffectTick: null, recoveryAttempt: 0, terminalReason: null }
      }]
    };
    const proposal = manager.propose(observation(20, [unit("guard-1", homeNode, 0), bait, focused]), state);

    expect(proposal.statePatch?.squads?.find((squad) => squad.role === "attack")?.objectiveId).toBe("enemy-focus");
    expect(proposal.statePatch?.squads?.some((squad) => squad.role === "defense")).toBe(false);
  });

  it("requires sustained hopelessness, then emits exactly one authoritative concession intent", () => {
    const initial = createAiBrainStateV1({ playerNumber: 1, faction: FactionType.Tivara, profile, tick: 0, archetypeId: "balanced" });
    const state = { ...initial, skirmish: { ...initial.skirmish, mode: { ...initial.skirmish.mode, state: "hopeless" as const, hopelessSinceTick: 0 } } };
    const proposal = manager.propose(observation(AI_STAGE_9_CONCESSION_HOPELESS_TICKS, [], []), state);

    expect(proposal.intents).toContainEqual(expect.objectContaining({ kind: "concede", reason: "sustained_no_recoverable_route" }));
    expect(proposal.statePatch?.skirmish?.mode.concessionIntentId).toEqual(expect.any(String));
  });
});
