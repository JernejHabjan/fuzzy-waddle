import {
  FactionType,
  ObjectNames,
  OrderType,
  ProbableWaffleAiDifficulty,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor, unknownAiValue } from "../testing/ai-test-fixtures";
import { buildAiAccessGraphV1 } from "./ai-access-graph-v1";
import { AiMacroManager } from "./ai-macro-manager";

const constructionCells = Array.from({ length: 36 }, (_, index) => {
  const x = 8 + (index % 6);
  const y = 8 + Math.floor(index / 6);
  return {
    tileKey: `${x},${y}`,
    position: { x, y, z: 0 },
    groundPassable: true,
    waterPassable: false,
    elevation: 0,
    observedBlocked: false
  };
});

const catalog: AiCapabilityCatalogV1 = {
  schemaVersion: 1,
  generation: 1,
  unsupported: [],
  entries: [
    {
      capabilityId: "worker",
      family: "worker",
      sourceObjectName: ObjectNames.TivaraWorker,
      effectiveLevel: 1,
      movementDomains: ["ground"],
      targetDomains: [],
      produces: [],
      constructs: [ObjectNames.Granary, ObjectNames.Field],
      researches: [],
      gathers: [ResourceType.Food, ResourceType.Wood],
      housingCapacity: null,
      housingCost: 1,
      cargoCapacity: null
    },
    {
      capabilityId: "granary",
      family: "resource_drop_off",
      sourceObjectName: ObjectNames.Granary,
      effectiveLevel: 1,
      movementDomains: [],
      targetDomains: [],
      produces: [],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: null,
      cargoCapacity: 2,
      acceptsResources: [ResourceType.Food],
      constructionProfile: {
        resourceCost: { [ResourceType.Wood]: 80 },
        requiredObjectNames: [],
        footprintRadiusTiles: 1,
        visionRange: 10,
        navigableHeight: null,
        enterHeight: null,
        exitHeight: null
      }
    },
    {
      capabilityId: "field",
      family: "resource_source",
      sourceObjectName: ObjectNames.Field,
      effectiveLevel: 1,
      movementDomains: [],
      targetDomains: [],
      produces: [],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: null,
      cargoCapacity: null,
      constructionProfile: {
        resourceCost: { [ResourceType.Wood]: 60 },
        requiredObjectNames: [ObjectNames.Granary],
        footprintRadiusTiles: 0,
        visionRange: 2,
        navigableHeight: null,
        enterHeight: null,
        exitHeight: null
      }
    }
  ]
};

function state(): AiBrainStateV1 {
  return createAiBrainStateV1({
    playerNumber: 1,
    faction: FactionType.Tivara,
    profile: createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium),
    tick: 200,
    archetypeId: "balanced",
    completedOpeningStepIds: [
      "step:opening:bootstrap-worker",
      "step:opening:supply-safety",
      "step:opening:first-producer",
      "step:opening:sustainable-food"
    ]
  });
}

function observation(granaryCount: number, workerCount = 6) {
  const base = createAiTestObservation();
  const workers = Array.from({ length: workerCount }, (_, index) => createAiTestOwnedActor(`worker-${index}`));
  const granaries = Array.from({ length: granaryCount }, (_, index) => ({
    ...createAiTestOwnedActor(`granary-${index}`),
    objectName: ObjectNames.Granary
  }));
  return {
    ...base,
    tick: 200,
    actors: [...workers, ...granaries],
    map: { ...base.map!, constructionCells },
    resources: base.resources.map((resource) => ({
      ...resource,
      stockpile: resource.resourceType === ResourceType.Wood ? 230 : 100
    }))
  };
}

describe("AI food infrastructure", () => {
  it.each([60, 159, 160])("H-18: saves pending housing cash before expanding existing food at %i wood", (wood) => {
    const fieldEntry = catalog.entries.find((entry) => entry.sourceObjectName === ObjectNames.Field);
    if (!fieldEntry?.constructionProfile) throw new Error("field_price_missing");
    const withHousing: AiCapabilityCatalogV1 = {
      ...catalog,
      entries: [
        ...catalog.entries.map((entry) =>
          entry.sourceObjectName === ObjectNames.TivaraWorker
            ? { ...entry, constructs: [...entry.constructs, ObjectNames.Olival] }
            : entry
        ),
        {
          ...fieldEntry,
          capabilityId: "housing",
          sourceObjectName: ObjectNames.Olival,
          housingCapacity: 8,
          constructionProfile: { ...fieldEntry.constructionProfile, resourceCost: { [ResourceType.Wood]: 100 } }
        }
      ]
    };
    const base = observation(2, 8);
    const readyField = { ...createAiTestOwnedActor("ready-field"), objectName: ObjectNames.Field };
    const assignedWorker = base.actors[0];
    if (!assignedWorker) throw new Error("worker_missing");
    const world = {
      ...base,
      actors: [
        ...base.actors.map((actor) => actor.actorId === assignedWorker.actorId
          ? {
              ...actor,
              activeOrder: {
                status: "known" as const,
                value: { orderType: OrderType.Gather, targetActorId: readyField.actorId },
                observedTick: 200
              }
            }
          : actor),
        {
          ...createAiTestOwnedActor("home"),
          objectName: ObjectNames.Sandhold,
          housingCost: { status: "known" as const, value: 0, observedTick: 200 },
          housingCapacity: { status: "known" as const, value: 8, observedTick: 200 }
        },
        readyField
      ],
      resources: base.resources.map((resource) =>
        resource.resourceType === ResourceType.Wood
          ? { ...resource, stockpile: wood, reservedUnspent: 0, obligationsDue: 0 }
          : resource
      )
    };
    const macro = new AiMacroManager(() => withHousing);
    const expanded = macro.propose(world, state());
    expect(expanded.statePatch?.economyProduction?.demands).toContainEqual(
      expect.objectContaining({
        purpose: "supply_buffer",
        resourceObligations: { wood: 100 }
      })
    );
    expect(
      expanded.intents.some((intent) => intent.kind === "construct" && intent.objectName === ObjectNames.Field)
    ).toBe(wood >= 160);
    const bootstrap = macro.propose(
      {
        ...world,
        actors: world.actors
          .filter((actor) => actor.objectName !== ObjectNames.Field)
          .map((actor) => actor.actorId === assignedWorker.actorId
            ? { ...actor, activeOrder: { status: "known" as const, value: null, observedTick: 200 } }
            : actor)
      },
      state()
    );
    expect(
      bootstrap.intents.some((intent) => intent.kind === "construct" && intent.objectName === ObjectNames.Field)
    ).toBe(true);
  });
  it("bootstraps a food prerequisite during an unfinished opening without completing its historical step", () => {
    const initial = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile: createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium),
      tick: 200,
      archetypeId: "balanced"
    });
    const proposal = new AiMacroManager(() => catalog).propose(observation(0), initial);

    expect(
      proposal.statePatch?.economyProduction?.demands.some(
        (candidate) => candidate.purpose === "food_drop_off_capacity"
      )
    ).toBe(true);
    expect(
      proposal.statePatch?.opening?.plan.steps.find((step) => step.stepId === "step:opening:sustainable-food")?.state
    ).not.toBe("completed");
  });

  it("rebuilds a destroyed prerequisite without reopening completed opening history", () => {
    const proposal = new AiMacroManager(() => catalog).propose(observation(0), state());

    expect(proposal.intents).toContainEqual(
      expect.objectContaining({ kind: "construct", objectName: ObjectNames.Granary })
    );
    expect(proposal.intents).not.toContainEqual(
      expect.objectContaining({ kind: "construct", objectName: ObjectNames.Field })
    );
    expect(proposal.statePatch?.opening?.plan.lifecycle).toBe("completed");
    const unfunded = observation(0);
    expect(
      new AiMacroManager(() => catalog)
        .propose(
          {
            ...unfunded,
            resources: unfunded.resources.map((resource) => ({ ...resource, stockpile: 109 }))
          },
          state()
        )
        .intents.some((intent) => intent.kind === "construct")
    ).toBe(false);
  });

  it("adds a useful duplicate drop-off only when forecast-backed Field capacity justifies it", () => {
    const proposal = new AiMacroManager(() => catalog).propose(observation(1, 10), state());
    const demand = proposal.statePatch?.economyProduction?.demands.find(
      (candidate) => candidate.purpose === "food_drop_off_capacity"
    );

    expect(demand).toMatchObject({ desired: 2, satisfiedActorIds: ["granary-0"] });
    expect(proposal.intents).toContainEqual(
      expect.objectContaining({ kind: "construct", objectName: ObjectNames.Granary })
    );
  });

  it("prefers a safe Field site aligned with the existing food row when one is available", () => {
    const base = observation(2, 8);
    const field = {
      ...createAiTestOwnedActor("ready-field"),
      objectName: ObjectNames.Field,
      logicalPosition: { status: "known" as const, value: { x: 10, y: 10, z: 0 }, observedTick: 200 }
    };
    const granary = {
      ...createAiTestOwnedActor("ready-granary"),
      objectName: ObjectNames.Granary,
      logicalPosition: { status: "known" as const, value: { x: 9, y: 10, z: 0 }, observedTick: 200 }
    };
    const assignedWorker = base.actors[0];
    if (!assignedWorker) throw new Error("worker_missing");
    const world = {
      ...base,
      actors: [
        ...base.actors.map((actor) => actor.actorId === assignedWorker.actorId
          ? { ...actor, activeOrder: { status: "known" as const, value: { orderType: OrderType.Gather, targetActorId: field.actorId }, observedTick: 200 } }
          : actor),
        granary,
        field
      ],
      map: {
        ...base.map!,
        constructionCells: base.map!.constructionCells!.map((cell) => cell.tileKey === "10,10"
          ? { ...cell, observedBlocked: true }
          : cell)
      }
    };
    const proposal = new AiMacroManager(() => catalog).propose(world, state());
    const nextField = proposal.intents.find(
      (intent) => intent.kind === "construct" && intent.objectName === ObjectNames.Field
    );

    expect(nextField?.kind).toBe("construct");
    if (nextField?.kind !== "construct") return;
    expect(nextField.logicalPosition.x === field.logicalPosition.value.x ||
      nextField.logicalPosition.y === field.logicalPosition.value.y).toBe(true);
  });

  it("staffs an existing Field before opening another Field construction", () => {
    const field = {
      ...createAiTestOwnedActor("field-ready"),
      objectName: ObjectNames.Field,
      resourceState: {
        status: "known" as const,
        observedTick: 200,
        value: {
          resourceType: ResourceType.Food,
          available: { status: "known" as const, value: 100, observedTick: 200 },
          carried: unknownAiValue,
          growthReadyTick: unknownAiValue,
          serviceCapacity: { status: "known" as const, value: 1, observedTick: 200 }
        }
      }
    };
    const proposal = new AiMacroManager(() => catalog).propose(
      { ...observation(1), actors: [...observation(1).actors, field] },
      state()
    );
    const labor = proposal.intents.find(
      (intent) => intent.kind === "assign_gatherers" && intent.sourceActorId === field.actorId
    );
    const construction = proposal.intents.find(
      (intent) => intent.kind === "construct" && intent.objectName === ObjectNames.Field
    );

    expect(labor).toEqual(expect.objectContaining({ kind: "assign_gatherers" }));
    expect(construction).toBeUndefined();
    expect(labor?.utility).toBeGreaterThan(construction?.utility ?? 0);
  });

  it("opens another Field only after the existing Field already has a food worker", () => {
    const base = observation(1, 10);
    const field = { ...createAiTestOwnedActor("field-ready"), objectName: ObjectNames.Field };
    const staffed = {
      ...base,
      actors: [
        ...base.actors.map((actor, index) => index === 0
          ? {
              ...actor,
              activeOrder: {
                status: "known" as const,
                value: { orderType: OrderType.Gather, targetActorId: field.actorId },
                observedTick: 200
              }
            }
          : actor),
        field
      ]
    };
    const proposal = new AiMacroManager(() => catalog).propose(staffed, state());

    expect(proposal.intents).not.toContainEqual(expect.objectContaining({ kind: "assign_gatherers" }));
    expect(proposal.intents).toContainEqual(expect.objectContaining({ kind: "construct", objectName: ObjectNames.Field }));
  });

  it("keeps new Fields in a known ground region reachable from a food drop-off", () => {
    const base = observation(1);
    const baseMap = base.map;
    if (!baseMap) throw new Error("test_map_missing");
    const access = buildAiAccessGraphV1({
      generation: 1,
      staticRevision: 1,
      dynamicRevision: 1,
      threatRevision: 1,
      builtTick: 200,
      continuationCursor: 0,
      includeAirRegion: false,
      cells: [
        { x: 0, y: 0, ground: true, water: false, elevation: 0, groundNeighborKeys: ["1,0"], knowledge: "known_static", clearance: 1 },
        { x: 1, y: 0, ground: true, water: false, elevation: 0, groundNeighborKeys: ["0,0"], knowledge: "known_static", clearance: 1 },
        { x: 4, y: 0, ground: true, water: false, elevation: 0, groundNeighborKeys: [], knowledge: "known_static", clearance: 1 }
      ]
    });
    const dropOffNodeId = access.groundNodeByTileKey.get("0,0");
    const connectedFieldNodeId = access.groundNodeByTileKey.get("1,0");
    const disconnectedNodeId = access.groundNodeByTileKey.get("4,0");
    if (!dropOffNodeId || !connectedFieldNodeId || !disconnectedNodeId) throw new Error("test_access_nodes_missing");
    const cells = constructionCells.map((cell) => ({
      ...cell,
      groundAccessNodeId: (cell.position.x < 11 ? disconnectedNodeId : connectedFieldNodeId) as never
    }));
    const world = {
      ...base,
      actors: base.actors.map((actor) => ({
        ...actor,
        accessNodeId: { status: "known" as const, value: dropOffNodeId, observedTick: 200 },
        ...(actor.objectName === ObjectNames.Granary
          ? { logicalPosition: { status: "known" as const, value: { x: 12, y: 10, z: 0 }, observedTick: 200 } }
          : {})
      })),
      map: {
        ...baseMap,
        constructionCells: cells,
        accessGraph: {
          ...access.graph,
          links: [
            ...access.graph.links,
            {
              linkId: "test:one-way-from-remote",
              fromNodeId: disconnectedNodeId,
              toNodeId: dropOffNodeId,
              domain: "ground" as const,
              clearance: 1,
              distanceCost: 1,
              knowledge: "known_static" as const,
              directional: true
            }
          ]
        },
        regionGeneration: { generation: 1, status: "ready" as const, continuationCursor: 0 }
      }
    };

    const proposal = new AiMacroManager(() => catalog).propose(world, state());
    const field = proposal.intents.find(
      (intent) => intent.kind === "construct" && intent.objectName === ObjectNames.Field
    );
    const selectedCell = cells.find((cell) =>
      field?.kind === "construct" && cell.tileKey === `${field.logicalPosition.x},${field.logicalPosition.y}`
    );

    expect(field).toBeDefined();
    expect(selectedCell?.groundAccessNodeId).toBe(connectedFieldNodeId);
    expect(selectedCell?.groundAccessNodeId).not.toBe(disconnectedNodeId);

    const farWorld = {
      ...world,
      map: {
        ...world.map,
        constructionCells: cells.map((cell) => ({
          ...cell,
          tileKey: `${cell.position.x + 20},${cell.position.y + 20}`,
          position: { ...cell.position, x: cell.position.x + 20, y: cell.position.y + 20 }
        }))
      }
    };
    const farProposal = new AiMacroManager(() => catalog).propose(farWorld, state());
    expect(farProposal.intents).not.toContainEqual(
      expect.objectContaining({ kind: "construct", objectName: ObjectNames.Field })
    );
  });

  it("retries Field capacity after a rejected effect instead of counting it forever", () => {
    const previous = state();
    const effectId = "food-capacity:Field:effect:4:0" as never;
    const proposal = new AiMacroManager(() => catalog).propose(observation(2), {
      ...previous,
      reservations: [
        {
          claimId: "claim:field" as never,
          subjectKey: `effect:${effectId}`,
          ownerPlanId: previous.opening.plan.planId,
          state: { kind: "applied_spending", appliedTick: 190 as never },
          prerequisites: [],
          createdTick: 180 as never
        }
      ],
      pendingOutcomes: [
        {
          kind: "rejected",
          tick: 195 as never,
          reason: "construction_prerequisites_not_met",
          identity: {
            matchId: "match" as never,
            authorityEpoch: 0,
            playerNumber: 1,
            sequence: 4,
            commandId: "command:4" as never,
            effectId,
            intentId: "intent:4" as never
          }
        }
      ]
    });
    const demand = proposal.statePatch?.economyProduction?.demands.find(
      (candidate) => candidate.purpose === "renewable_food_capacity"
    );

    expect(demand?.acceptedNotObservedEffectIds).toEqual([]);
    expect(proposal.intents).toContainEqual(
      expect.objectContaining({ kind: "construct", objectName: ObjectNames.Field })
    );
  });
});
