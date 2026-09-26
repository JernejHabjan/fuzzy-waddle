import { FactionType, ObjectNames, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { buildAiAccessGraphV1 } from "./ai-access-graph-v1";
import { AiSkirmishManager } from "./ai-skirmish-manager";

const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
const access = buildAiAccessGraphV1({
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
      clearance: 2
    }
  ]
});
const home = access.groundNodeByTileKey.get("0,0")!;
const front = access.groundNodeByTileKey.get("1,0")!;
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

function guard(actorId: string, relation: "self" | "enemy", x: number): AiObservedActorV1 {
  return {
    ...createAiTestOwnedActor(actorId),
    objectName: ObjectNames.TivaraMacemanMale,
    owner: relation === "self" ? 1 : 2,
    relation,
    visibility: relation === "self" ? "owned" : "visible",
    logicalPosition: { status: "known", value: { x, y: 0, z: 0 }, observedTick: 20 },
    accessNodeId: { status: "known", value: relation === "self" ? home : front, observedTick: 20 },
    housingCost: { status: "known", value: 1, observedTick: 20 },
    capabilities: [
      {
        id: `${actorId}:attack`,
        family: "military",
        level: 1,
        domains: ["ground"],
        targetDomains: ["ground"],
        capacity: { status: "known", value: 0, observedTick: 20 }
      }
    ],
    containedInActorId: null
  };
}

function core(actorId: string): AiObservedActorV1 {
  return {
    ...guard(actorId, "enemy", 1),
    housingCost: { status: "known", value: 0, observedTick: 20 },
    capabilities: [],
    mainBuilding: { status: "known", value: true, observedTick: 20 }
  };
}

function producer(actorId: string): AiObservedActorV1 {
  return {
    ...core(actorId),
    mainBuilding: { status: "known", value: false, observedTick: 20 },
    capabilities: [
      {
        id: `${actorId}:produce`,
        family: "produce",
        level: 1,
        domains: ["ground"],
        targetDomains: [],
        capacity: { status: "known", value: 1, observedTick: 20 }
      }
    ]
  };
}

function world(actors: readonly AiObservedActorV1[], tick = 20): AiObservationV1 {
  return {
    ...createAiTestObservation(),
    tick,
    actors,
    map: {
      bounds: { status: "known", value: { width: 2, height: 1 }, observedTick: tick },
      staticRevision: 1,
      frontierAccessNodeIds: [front],
      scoutCoverageAccessNodeIds: [],
      dynamicObstacleActorIds: [],
      regionGeneration: { generation: 1, status: "ready", continuationCursor: 0 },
      accessGraph: access.graph
    }
  };
}

function brain(): AiBrainStateV1 {
  return createAiBrainStateV1({
    playerNumber: 1,
    faction: FactionType.Tivara,
    profile,
    tick: 0,
    archetypeId: "balanced"
  });
}

const manager = new AiSkirmishManager(profile, () => catalog);

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
      squads: [{
        ...launched,
        actorIds: [],
        state: "completed",
        lifecycle: { ...launched.lifecycle, terminalReason: "no_members_released" }
      }],
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
    const renewed = manager.propose(
      world([...actors, guard("c", "self", 0), guard("d", "self", 0)], 400),
      { ...failed, squads: [], strategy: rebuilding.statePatch.strategy, skirmish: rebuilding.statePatch.skirmish }
    );
    expect(renewed.statePatch?.strategy?.assessment).toEqual(
      expect.objectContaining({ choice: "finish", requiredForce: 4 })
    );
    expect(renewed.intents).toContainEqual(expect.objectContaining({ kind: "attack", targetActorId: "enemy-core" }));
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
    const result = manager.propose(
      world([guard("a", "self", 0), guard("b", "self", 0), core("enemy-core")]),
      { ...initial, opening: { ...initial.opening, plan: { ...initial.opening.plan, lifecycle: "completed" } } }
    );

    expect(result.statePatch?.strategy?.assessment?.choice).toBe("finish");
    expect(result.intents).toContainEqual(expect.objectContaining({ kind: "attack", targetActorId: "enemy-core" }));
  });

  it("does not count shoreline ground troops as a naval force against a water objective", () => {
    const waterAccess = buildAiAccessGraphV1({
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
          groundNeighborKeys: [],
          knowledge: "known_static",
          clearance: 2
        },
        {
          x: 1,
          y: 0,
          ground: false,
          water: true,
          elevation: 0,
          groundNeighborKeys: [],
          knowledge: "known_static",
          clearance: 2
        }
      ]
    });
    const shore = waterAccess.groundNodeByTileKey.get("0,0")!;
    const water = waterAccess.waterNodeByTileKey.get("1,0")!;
    const attacker = {
      ...guard("guard", "self", 0),
      accessNodeId: { status: "known" as const, value: shore, observedTick: 20 },
      capabilities: [
        {
          id: "guard:shore-weapon",
          family: "military",
          level: 1,
          domains: ["ground" as const],
          targetDomains: ["water" as const],
          capacity: { status: "known" as const, value: 0, observedTick: 20 }
        }
      ]
    };
    const boat = {
      ...guard("boat", "enemy", 1),
      housingCost: { status: "known" as const, value: 0, observedTick: 20 },
      accessNodeId: { status: "known" as const, value: water, observedTick: 20 },
      capabilities: [
        {
          id: "boat:water",
          family: "transport",
          level: 1,
          domains: ["water" as const],
          targetDomains: [],
          capacity: { status: "known" as const, value: 0, observedTick: 20 }
        }
      ]
    };
    const observation = world([attacker, boat]);
    const result = manager.propose(
      { ...observation, map: { ...observation.map!, accessGraph: waterAccess.graph } },
      brain()
    );

    expect(result.statePatch?.strategy?.assessment?.choice).toBe("scout");
    expect(result.intents.some((intent) => intent.kind === "attack")).toBe(false);
  });

  it("finds an air route to an observed core when the land regions are disconnected", () => {
    const separated = buildAiAccessGraphV1({
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
          groundNeighborKeys: [],
          knowledge: "known_static",
          clearance: 2
        },
        {
          x: 2,
          y: 0,
          ground: true,
          water: false,
          elevation: 0,
          groundNeighborKeys: [],
          knowledge: "known_static",
          clearance: 2
        }
      ]
    });
    const ownGround = separated.groundNodeByTileKey.get("0,0")!;
    const enemyGround = separated.groundNodeByTileKey.get("2,0")!;
    const ground = {
      ...guard("ground", "self", 0),
      accessNodeId: { status: "known" as const, value: ownGround, observedTick: 20 }
    };
    const air = {
      ...guard("owl", "self", 0),
      accessNodeId: { status: "known" as const, value: separated.airNodeId!, observedTick: 20 },
      capabilities: [
        {
          id: "owl:air",
          family: "military",
          level: 1,
          domains: ["air" as const],
          targetDomains: ["ground" as const],
          capacity: { status: "known" as const, value: 0, observedTick: 20 }
        }
      ]
    };
    const enemy = {
      ...core("enemy-core"),
      accessNodeId: { status: "known" as const, value: enemyGround, observedTick: 20 }
    };
    const observation = world([ground, air, enemy]);
    const result = manager.propose(
      { ...observation, map: { ...observation.map!, accessGraph: separated.graph } },
      brain()
    );

    expect(result.statePatch?.strategy?.assessment).toEqual(
      expect.objectContaining({ targetActorId: "enemy-core", routeDomain: "air", readyForce: 1 })
    );
    expect(result.statePatch?.squads?.find((squad) => squad.role === "attack")?.actorIds).toEqual(["owl"]);
  });

  it("assembles against a visible counterforce and retains a reason instead of sending a token attack", () => {
    const enemies = [core("enemy-core"), ...[1, 2, 3, 4].map((index) => guard(`defender-${index}`, "enemy", 1))];
    const result = manager.propose(world([guard("a", "self", 0), guard("b", "self", 0), ...enemies]), brain());

    expect(result.statePatch?.skirmish?.timeline.some((event) => event.detail.startsWith("launch:"))).toBe(false);
    expect(result.statePatch?.squads?.find((squad) => squad.role === "attack")?.state).toBe("forming");
    expect(result.statePatch?.strategy?.assessment?.reason).toBe("assembling_compatible_force");
  });

  it("keeps assembling when a severe observed counterforce outlasts the assembly deadline", () => {
    const enemies = [core("enemy-core"), ...[1, 2, 3, 4].map((index) => guard(`defender-${index}`, "enemy", 1))];
    const initial = brain();
    const first = manager.propose(world([guard("a", "self", 0), guard("b", "self", 0), ...enemies]), initial);
    const state: AiBrainStateV1 = {
      ...initial,
      squads: first.statePatch!.squads!,
      skirmish: first.statePatch!.skirmish!
    };

    const later = manager.propose(world([guard("a", "self", 0), guard("b", "self", 0), ...enemies], 1300), state);
    expect(later.statePatch?.squads?.find((squad) => squad.role === "attack")?.state).toBe("forming");
    expect(later.statePatch?.skirmish?.timeline.some((event) => event.detail.startsWith("launch:"))).toBe(false);
  });

  it("changes plan when the same force has lost its worker economy", () => {
    const initial = brain();
    const completedOpening: AiBrainStateV1 = {
      ...initial,
      opening: { ...initial.opening, plan: { ...initial.opening.plan, lifecycle: "completed" } }
    };
    const actors = [guard("a", "self", 0), core("enemy-core")];
    const healthyWorkers = [1, 2, 3].map((index) => ({
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
