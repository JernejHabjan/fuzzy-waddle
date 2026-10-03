import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import {
  FactionType,
  ObjectNames,
  ProbableWaffleAiDifficulty,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import { aiDeadline } from "../contracts/ai-core-types";
import type { AiObservedActorV1, AiObservationV1 } from "../contracts/ai-observation-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { AiFortificationManager } from "./ai-fortification-manager";

const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);

const catalog: AiCapabilityCatalogV1 = {
  schemaVersion: 1,
  generation: 1,
  unsupported: [],
  entries: [
    {
      capabilityId: "worker",
      family: "build",
      sourceObjectName: ObjectNames.TivaraWorker,
      effectiveLevel: 1,
      movementDomains: ["ground"],
      targetDomains: [],
      produces: [],
      constructs: [ObjectNames.Wall, ObjectNames.WatchTower, ObjectNames.Stairs, ObjectNames.Olival],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: 1,
      cargoCapacity: null
    },
    {
      capabilityId: "wall",
      family: "passive",
      sourceObjectName: ObjectNames.Wall,
      effectiveLevel: 1,
      movementDomains: ["ground"],
      targetDomains: [],
      produces: [],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: null,
      cargoCapacity: null,
      constructionProfile: {
        resourceCost: { [ResourceType.Stone]: 25 },
        footprintRadiusTiles: 0,
        visionRange: 10,
        navigableHeight: 42,
        enterHeight: 64,
        exitHeight: 64
      }
    },
    {
      capabilityId: "tower",
      family: "attack",
      sourceObjectName: ObjectNames.WatchTower,
      effectiveLevel: 1,
      movementDomains: ["ground"],
      targetDomains: ["ground", "water"],
      produces: [],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: null,
      cargoCapacity: null,
      constructionProfile: {
        resourceCost: { [ResourceType.Stone]: 250 },
        footprintRadiusTiles: 0,
        visionRange: 18,
        navigableHeight: 104,
        enterHeight: 64,
        exitHeight: 64
      }
    },
    {
      capabilityId: "stairs",
      family: "passive",
      sourceObjectName: ObjectNames.Stairs,
      effectiveLevel: 1,
      movementDomains: ["ground"],
      targetDomains: [],
      produces: [],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: null,
      cargoCapacity: null,
      constructionProfile: {
        resourceCost: { [ResourceType.Stone]: 25 },
        footprintRadiusTiles: 0,
        visionRange: 10,
        navigableHeight: 24,
        enterHeight: 0,
        exitHeight: 64
      }
    },
    {
      capabilityId: "gate-double",
      family: "passive",
      sourceObjectName: ObjectNames.Olival,
      effectiveLevel: 1,
      movementDomains: ["ground"],
      targetDomains: [],
      produces: [],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: null,
      cargoCapacity: null,
      constructionProfile: {
        resourceCost: { [ResourceType.Stone]: 50 },
        footprintRadiusTiles: 0,
        visionRange: 8,
        navigableHeight: 0,
        enterHeight: 0,
        exitHeight: 0
      }
    }
  ]
};

function actor(
  actorId: string,
  objectName: ObjectNames,
  x: number,
  y: number,
  relation: "self" | "enemy" = "self"
): AiObservedActorV1 {
  return {
    ...createAiTestOwnedActor(actorId),
    objectName,
    owner: relation === "self" ? 1 : 2,
    relation,
    visibility: relation === "self" ? "owned" : "visible",
    logicalPosition: { status: "known", value: { x, y, z: 0 }, observedTick: 100 },
    accessNodeId: { status: "known", value: "access:main", observedTick: 100 },
    ...(relation === "self"
      ? { mainBuilding: { status: "known" as const, value: objectName === ObjectNames.Sandhold, observedTick: 100 } }
      : {})
  };
}

function observation(extraActors: readonly AiObservedActorV1[] = [], tick = 100): AiObservationV1 {
  const cells = [];
  for (let y = 0; y <= 20; y += 1) {
    for (let x = 0; x <= 20; x += 1) {
      const anchor = x === 9 && (y === 6 || y === 14);
      cells.push({
        tileKey: `${x},${y}`,
        position: { x, y, z: 0 },
        groundPassable: !anchor,
        waterPassable: false,
        elevation: 0,
        observedBlocked: anchor
      });
    }
  }
  return {
    ...createAiTestObservation(),
    generation: 1,
    tick,
    actors: [
      actor("main", ObjectNames.Sandhold, 5, 10),
      actor("worker", ObjectNames.TivaraWorker, 6, 10),
      actor("worker-reserve", ObjectNames.TivaraWorker, 6, 11),
      actor("enemy", ObjectNames.SkaduweeWorker, 18, 10, "enemy"),
      ...extraActors
    ],
    resources: [
      {
        resourceType: ResourceType.Stone,
        stockpile: 5_000,
        reservedUnspent: 0,
        obligationsDue: 0,
        deliveredIncomePerMinute: { status: "known", value: 20, observedTick: tick }
      }
    ],
    threatSummary: {
      observedTick: tick,
      visibleEnemyActorIds: ["enemy"],
      rememberedEnemyActorIds: [],
      observedCapabilityFamilies: ["attack"]
    },
    map: {
      bounds: { status: "known", value: { width: 21, height: 21 }, observedTick: tick },
      staticRevision: 1,
      frontierAccessNodeIds: [],
      scoutCoverageAccessNodeIds: [],
      dynamicObstacleActorIds: [],
      regionGeneration: { generation: 1, status: "ready", continuationCursor: 0 },
      constructionCells: cells
    }
  };
}

function threatenedState(): AiBrainStateV1 {
  const initial = createAiBrainStateV1({
    playerNumber: 1,
    faction: FactionType.Tivara,
    profile,
    tick: 0,
    archetypeId: "opening:1:balanced"
  });
  return {
    ...initial,
    bases: [
      {
        baseId: "base:main:main",
        anchorActorId: "main",
        memberActorIds: ["main", "worker", "worker-reserve"],
        active: true,
        lifecycle: "active",
        anchorPosition: { x: 5, y: 10, z: 0 }
      }
    ],
    skirmish: {
      ...initial.skirmish,
      incidents: [
        {
          incidentId: "incident:front",
          baseId: "base:main:main",
          regionId: "access:main",
          hostileActorIds: ["enemy"],
          kind: "army_pressure",
          confidencePermille: 1000,
          severity: 700,
          createdTick: 80,
          expiresAt: aiDeadline(300)
        }
      ]
    }
  };
}

describe("AiFortificationManager", () => {
  const manager = new AiFortificationManager(profile, () => catalog);

  it("WALL-01/02 creates a deterministic bounded front with a permanently empty opening", () => {
    const first = manager.propose(observation(), threatenedState());
    const second = manager.propose(observation(), threatenedState());
    const graph = first.statePatch?.fortifications?.[0]?.graph;

    expect(graph).toEqual(second.statePatch?.fortifications?.[0]?.graph);
    expect(graph?.wholeConnectivity).toBe("preserved");
    expect(graph?.incrementalConnectivity).toBe("preserved");
    expect(graph?.nodes.filter((node) => node.kind === "gate_slot")).toHaveLength(1);
    expect(first.intents.every((intent) => intent.kind !== "construct" || intent.objectName !== null)).toBe(true);
  });

  it("H-27 rejects an unanchored open-field wall that has no measured choke value", () => {
    const open = observation();
    const proposal = manager.propose(
      {
        ...open,
        map: {
          ...open.map!,
          constructionCells: open.map!.constructionCells!.map((cell) => ({
            ...cell,
            groundPassable: true,
            observedBlocked: false
          }))
        }
      },
      threatenedState()
    );

    expect(proposal.statePatch?.fortifications).toEqual([]);
    expect(proposal.reasons).toContain("no_justified_connected_choke");
  });

  it("WALL-03 records marginal tower coverage and only definition-supported target domains", () => {
    const graph = manager.propose(observation(), threatenedState()).statePatch?.fortifications?.[0]?.graph;
    const towers = graph?.nodes.filter((node) => node.kind === "tower") ?? [];

    expect(towers).toHaveLength(2);
    expect(towers.every((tower) => tower.marginalCoverage > 0)).toBe(true);
    expect(towers.every((tower) => !tower.targetDomains.includes("air"))).toBe(true);
    expect(graph?.nodes.filter((node) => node.kind === "stair").every((stair) => stair.defenderPostReachable)).toBe(
      true
    );
  });

  it("WALL-05 rejects a front that would consume a known shore staging lane", () => {
    const current = observation();
    const proposal = manager.propose(
      {
        ...current,
        map: {
          ...current.map!,
          accessGraph: {
            schemaVersion: 1,
            generation: 1,
            status: "ready",
            staticRevision: 1,
            dynamicRevision: 1,
            threatRevision: 1,
            builtTick: current.tick,
            continuationCursor: 0,
            nodes: [],
            links: [],
            unknownNodeIds: [],
            transferPoints: [
              {
                transferId: "shore:fortification",
                kind: "shore",
                fromNodeId: "access:ground",
                toNodeId: "access:water",
                passengerPosition: { x: 9, y: 7, z: 0 },
                carrierPosition: { x: 10, y: 7, z: 0 },
                clearance: 2,
                knowledge: "known_static"
              }
            ]
          }
        }
      },
      threatenedState()
    );

    expect(proposal.statePatch?.fortifications).toEqual([]);
    expect(proposal.reasons).toContain("no_justified_connected_choke");
  });

  it("reuses the reserved opening node for a future gate-capable definition without redesigning the graph", () => {
    const gateManager = new AiFortificationManager(profile, () => catalog, ObjectNames.Olival);
    const proposal = gateManager.propose(observation(), threatenedState());
    const graph = proposal.statePatch?.fortifications?.[0]?.graph;
    const opening = graph?.nodes.find((node) => node.nodeId === graph?.openingNodeId);

    expect(opening?.kind).toBe("gate_slot");
    expect(opening?.objectName).toBe(ObjectNames.Olival);
    expect(opening?.lifecycle).toBe("planned");
    expect(graph?.constructionSequenceNodeIds.at(-1)).toBe(opening?.nodeId);
  });

  it("preserves worker, survival, and supply macro floors before funding a new wall", () => {
    const state = threatenedState();
    const proposal = manager.propose(observation(), {
      ...state,
      economyProduction: {
        ...state.economyProduction,
        demands: [
          {
            demandId: "demand:supply:buffer",
            purpose: "supply_buffer",
            capabilityOrRole: "housing",
            unit: "population",
            desired: 3,
            satisfiedActorIds: [],
            queuedIds: [],
            constructingIds: [],
            acceptedNotObservedEffectIds: [],
            preferredObjectNames: [ObjectNames.Olival],
            resourceObligations: { [ResourceType.Stone]: 50 }
          }
        ]
      }
    });

    expect(proposal.statePatch?.fortifications).toEqual([]);
    expect(proposal.reasons).toContain("macro_survival_or_supply_floor_unmet");
  });

  it("keeps a partial construction requested and does not unlock its connected successor", () => {
    const first = manager.propose(observation(), threatenedState());
    const plan = first.statePatch?.fortifications?.[0];
    const root = plan?.graph?.nodes.find((node) => node.kind !== "gate_slot" && node.dependsOnNodeId === null);
    const successor = plan?.graph?.nodes.find((node) => node.dependsOnNodeId === root?.nodeId);
    if (!plan || !root?.objectName || !successor) throw new Error("invalid_partial_site_fixture");
    const partial = {
      ...actor("partial-site", root.objectName, root.position.x, root.position.y),
      constructionProgress: { status: "known" as const, value: 50, observedTick: 120 }
    };
    const proposal = manager.propose(observation([partial], 120), { ...threatenedState(), fortifications: [plan] });
    const nextRoot = proposal.statePatch?.fortifications?.[0]?.graph?.nodes.find((node) => node.nodeId === root.nodeId);

    expect(nextRoot?.lifecycle).toBe("requested");
    expect(
      proposal.intents.some((intent) => intent.kind === "construct" && intent.siteKey.includes(successor.nodeId))
    ).toBe(false);
  });

  it("H-28 reuses stable node effects and WALL-04 turns a missing finished node into one bounded repair", () => {
    const first = manager.propose(observation(), threatenedState());
    const plannedState = { ...threatenedState(), fortifications: first.statePatch!.fortifications! };
    const repeated = manager.propose(observation(), plannedState);
    expect(repeated.intents.map((intent) => intent.effectId)).toEqual(first.intents.map((intent) => intent.effectId));
    const firstConstruct = first.intents.find((intent) => intent.kind === "construct");
    const firstNode = first.statePatch!.fortifications![0]!.graph!.nodes.find(
      (node) => node.effectId === firstConstruct?.effectId
    );
    const reservedState: AiBrainStateV1 = {
      ...plannedState,
      reservations:
        firstNode && firstConstruct
          ? [
              {
                claimId: `claim:fortification:${firstNode.nodeId}:effect`,
                subjectKey: firstConstruct.effectId,
                ownerPlanId: firstConstruct.planId,
                state: { kind: "provisional", expiresAt: aiDeadline(180) },
                prerequisites: [],
                createdTick: 100
              }
            ]
          : []
    };
    const underConstruction = manager.propose(observation([], 120), reservedState);
    expect(underConstruction.intents.some((intent) => intent.effectId === firstConstruct?.effectId)).toBe(false);

    const plan = first.statePatch!.fortifications![0]!;
    const root = plan.graph!.nodes.find((node) => node.kind !== "gate_slot" && node.dependsOnNodeId === null)!;
    const breachedState = {
      ...threatenedState(),
      squads: [
        {
          squadId: "squad:defense" as const,
          role: "defense" as const,
          domain: "ground" as const,
          actorIds: ["guard" as ActorId],
          objectiveId: null,
          state: "ready" as const
        }
      ],
      fortifications: [
        {
          ...plan,
          lifecycle: "active" as const,
          graph: {
            ...plan.graph!,
            nodes: plan.graph!.nodes.map((node) =>
              node.nodeId === root.nodeId
                ? {
                    ...node,
                    lifecycle: "finished" as const,
                    completedActorId: "destroyed-wall" as ActorId,
                    retryAfterTick: 0
                  }
                : node
            )
          }
        }
      ]
    };
    const breached = manager.propose(
      observation([actor("guard", ObjectNames.TivaraMacemanMale, 7, 10)], 200),
      breachedState
    );

    expect(breached.statePatch?.fortifications).toHaveLength(1);
    expect(breached.statePatch?.fortifications?.[0]?.lifecycle).toBe("breached");
    expect(breached.intents.filter((intent) => intent.reasonCode.includes("breach_rebuild"))).toHaveLength(1);
    expect(
      breached.intents.some((intent) => intent.kind === "move" && intent.reasonCode.includes("breach_defenders"))
    ).toBe(true);
  });

  it("WALL-04 repairs a destroyed stair without recreating its retained connected component", () => {
    const first = manager.propose(observation(), threatenedState());
    const plan = first.statePatch?.fortifications?.[0];
    const stair = plan?.graph?.nodes.find((node) => node.kind === "stair");
    const dependency = plan?.graph?.nodes.find((node) => node.nodeId === stair?.dependsOnNodeId);
    if (!plan?.graph || !stair || !dependency?.objectName) throw new Error("invalid_fortification_fixture");
    const state: AiBrainStateV1 = {
      ...threatenedState(),
      fortifications: [
        {
          ...plan,
          lifecycle: "active",
          graph: {
            ...plan.graph,
            nodes: plan.graph.nodes.map((node) =>
              node.nodeId === stair.nodeId
                ? {
                    ...node,
                    lifecycle: "finished" as const,
                    completedActorId: "old-stair" as ActorId,
                    retryAfterTick: 0
                  }
                : node.nodeId === dependency.nodeId
                  ? {
                      ...node,
                      lifecycle: "finished" as const,
                      completedActorId: "retained-segment" as ActorId,
                      retryAfterTick: 400
                    }
                  : node
            )
          }
        }
      ]
    };
    const retained = actor("retained-segment", dependency.objectName, dependency.position.x, dependency.position.y);
    const proposal = manager.propose(observation([retained], 200), state);

    expect(proposal.statePatch?.fortifications).toHaveLength(1);
    expect(
      proposal.intents.some((intent) => intent.kind === "construct" && intent.objectName === ObjectNames.Stairs)
    ).toBe(true);
  });
});
