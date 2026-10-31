import {
  ObjectNames,
  OrderType,
  ProbableWaffleAiDifficulty,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { HIGH_GROUND_THRESHOLD } from "../../../entity/components/combat/high-ground-constants";
import type { AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import { createAiTestObservation, createAiTestOwnedActor, unknownAiValue } from "../testing/ai-test-fixtures";
import { completedOpeningState, catalog as macroCatalog } from "./ai-macro-test-fixtures";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { AiBaseManager } from "./ai-base-manager";
import { findAiExpansionBuilder } from "./ai-expansion-site";
import { aiEconomySiteSafety } from "./ai-economy-site-safety";
import { observedAiProducerThreats, isAiProducerPositionExposed } from "./ai-producer-safety";

function fixture() {
  const tick = 600;
  const main: AiObservedActorV1 = {
    ...createAiTestOwnedActor("main"),
    objectName: ObjectNames.Sandhold,
    mainBuilding: { status: "known", value: true, observedTick: tick },
    logicalPosition: { status: "known", value: { x: 0, y: 3, z: 0 }, observedTick: tick }
  };
  const worker: AiObservedActorV1 = {
    ...createAiTestOwnedActor("worker"),
    logicalPosition: { status: "known", value: { x: 1, y: 3, z: 0 }, observedTick: tick }
  };
  const distant: AiObservedActorV1 = {
    ...createAiTestOwnedActor("source"),
    objectName: ObjectNames.Tree1,
    relation: "neutral",
    visibility: "visible",
    owner: null,
    logicalPosition: { status: "known", value: { x: 20, y: 3, z: 0 }, observedTick: tick },
    resourceState: {
      status: "known",
      observedTick: tick,
      value: {
        resourceType: ResourceType.Wood,
        available: { status: "known", value: 500, observedTick: tick },
        carried: unknownAiValue,
        growthReadyTick: unknownAiValue,
        serviceCapacity: { status: "known", value: 4, observedTick: tick }
      }
    }
  };
  const catalog: AiCapabilityCatalogV1 = {
    ...macroCatalog,
    entries: macroCatalog.entries.map((entry) =>
      entry.sourceObjectName === ObjectNames.TivaraWorker
        ? { ...entry, constructs: [...entry.constructs, ObjectNames.Sandhold] }
        : entry.sourceObjectName === ObjectNames.Sandhold
          ? {
              ...entry,
              constructionProfile: {
                resourceCost: { wood: 400 },
                footprintRadiusTiles: 0,
                visionRange: 8,
                navigableHeight: null,
                enterHeight: null,
                exitHeight: null
              }
            }
          : entry
    )
  };
  const cells = [];
  for (let y = 0; y < 8; y += 1)
    for (let x = 0; x < 29; x += 1)
      cells.push({
        tileKey: `${x},${y}`,
        position: { x, y, z: 0 },
        groundPassable: true,
        waterPassable: false,
        observedBlocked: false,
        elevation: 0
      });
  const observation: AiObservationV1 = {
    ...createAiTestObservation(),
    tick,
    actors: [main, worker, distant],
    map: {
      bounds: { status: "known", value: { width: 29, height: 8 }, observedTick: tick },
      staticRevision: 1,
      regionGeneration: { generation: 1, status: "ready", continuationCursor: 0 },
      frontierAccessNodeIds: [],
      scoutCoverageAccessNodeIds: [],
      dynamicObstacleActorIds: [],
      constructionCells: cells
    }
  };
  const initial = completedOpeningState();
  const state = {
    ...initial,
    opening: { ...initial.opening, plan: { ...initial.opening.plan, lifecycle: "completed" as const } }
  };
  const manager = new AiBaseManager(createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium), () => catalog);
  return { observation, worker, state, catalog, manager };
}

describe("expansion placement and worker ownership", () => {
  it("EXP-01 skips a currently occupied candidate and still proposes an available legal site", () => {
    const f = fixture();
    const observation: AiObservationV1 = {
      ...f.observation,
      map: {
        ...f.observation.map!,
        constructionCells: f.observation.map!.constructionCells!.map((cell) => ({
          ...cell,
          observedBlocked: cell.tileKey === "24,3"
        }))
      }
    };
    const constructs = f.manager.propose(observation, f.state).intents.filter((intent) => intent.kind === "construct");
    expect(constructs).toHaveLength(1);
    expect(constructs[0]?.logicalPosition).not.toEqual({ x: 24, y: 3, z: 0 });
    expect(constructs[0]?.builderIds).toEqual(["worker"]);
  });

  it("EXP-01 rejects an expansion footprint inside a current visible weapon threat", () => {
    const f = fixture();
    const catalog = {
      ...f.catalog,
      entries: f.catalog.entries.map((entry) =>
        entry.sourceObjectName === ObjectNames.Sandhold
          ? {
              ...entry,
              constructionProfile: { ...entry.constructionProfile!, footprintRadiusTiles: 2 }
            }
          : entry
      )
    };
    const tower: AiObservedActorV1 = {
      ...createAiTestOwnedActor("enemy-tower"),
      objectName: ObjectNames.WatchTower,
      owner: 2,
      relation: "enemy",
      visibility: "visible",
      observedTick: f.observation.tick,
      logicalPosition: {
        status: "known",
        value: { x: 13, y: 3, z: HIGH_GROUND_THRESHOLD },
        observedTick: f.observation.tick
      },
      combatProfile: {
        status: "known",
        observedTick: f.observation.tick,
        value: {
          maxHealth: 1000,
          maxArmour: 0,
          passiveRegenerationPerSecond: 0,
          armourPermille: 0,
          attacks: [
            {
              damage: 20,
              cooldownTicks: 28,
              remainingCooldownTicks: null,
              range: 7,
              minRange: 0,
              highGroundRangeBonus: 2,
              impactDelayTicks: 10,
              areaRadius: 0,
              targetDomains: ["ground"]
            }
          ],
          healing: null,
          spells: [],
          statuses: []
        }
      }
    };
    const observation: AiObservationV1 = {
      ...f.observation,
      actors: [...f.observation.actors, tower],
      threatSummary: {
        observedTick: f.observation.tick,
        visibleEnemyActorIds: [tower.actorId],
        rememberedEnemyActorIds: [],
        observedCapabilityFamilies: ["attack"]
      }
    };
    expect(
      catalog.entries.find((entry) => entry.sourceObjectName === ObjectNames.Sandhold)?.constructionProfile
        ?.footprintRadiusTiles
    ).toBe(2);
    expect(observedAiProducerThreats(observation)).toHaveLength(1);
    expect(isAiProducerPositionExposed({ x: 22, y: 3, z: 0 }, observedAiProducerThreats(observation))).toBe(true);
    expect(aiEconomySiteSafety(observation).positionSafe({ x: 22, y: 3, z: 0 })).toBe(false);

    expect(
      findAiExpansionBuilder({
        observation,
        state: f.state,
        catalog,
        objectName: ObjectNames.Sandhold,
        position: { x: 24, y: 3, z: 0 },
        accessNodeId: null
      })
    ).toBeUndefined();
  });

  it.each(["cargo", "delivery", "construction", "transfer"])(
    "does not steal a worker holding %s for optional expansion",
    (kind) => {
      const f = fixture();
      const busy: AiObservedActorV1 = {
        ...f.worker,
        carriedResourceAmount: kind === "cargo" ? 3 : 0,
        resourceTransferInFlight: kind === "transfer",
        activeOrder: {
          status: "known",
          observedTick: 600,
          value:
            kind === "delivery" || kind === "construction"
              ? {
                  orderType: kind === "delivery" ? OrderType.ReturnResources : OrderType.Build,
                  targetActorId: "job"
                }
              : null
        }
      };
      const proposal = f.manager.propose(
        {
          ...f.observation,
          actors: f.observation.actors.map((actor) => (actor.actorId === busy.actorId ? busy : actor))
        },
        f.state
      );
      expect(proposal.intents).toEqual([]);
      expect(proposal.statePatch?.bases?.filter((base) => base.lifecycle === "proposed")).toEqual([]);
    }
  );

  it("EXP-01 declines a known blocked route instead of repeatedly assigning its builder", () => {
    const f = fixture();
    const observation: AiObservationV1 = {
      ...f.observation,
      accessProducts: [
        {
          fromNodeId: "access:worker",
          toNodeId: "access:remote",
          updatedTick: 600,
          status: "blocked",
          queryId: "route",
          revision: 1,
          domains: ["ground"]
        }
      ],
      actors: f.observation.actors.map((actor) => ({
        ...actor,
        accessNodeId: {
          status: "known",
          observedTick: 600,
          value: actor.actorId === "source" ? "access:remote" : "access:worker"
        }
      }))
    };
    expect(f.manager.propose(observation, f.state).intents).toEqual([]);
  });

  it("leaves an optional established proposal unfunded/unassigned when all compatible builders are busy", () => {
    const f = fixture();
    const busy = { ...f.worker, resourceTransferInFlight: true };
    expect(
      findAiExpansionBuilder({
        ...f,
        observation: { ...f.observation, actors: [busy] },
        objectName: ObjectNames.Sandhold,
        position: { x: 24, y: 3, z: 0 },
        accessNodeId: null
      })
    ).toBeUndefined();
  });

  it("EXP-02 defers expansion during visible home pressure and resumes once that contact becomes memory", () => {
    const f = fixture();
    const enemy: AiObservedActorV1 = {
      ...createAiTestOwnedActor("raider"),
      owner: 2,
      relation: "enemy",
      visibility: "visible",
      logicalPosition: { status: "known", value: { x: 3, y: 3, z: 0 }, observedTick: 600 },
      capabilities: [
        {
          id: "raider-attack",
          family: "attack",
          domains: ["ground"],
          targetDomains: ["ground"],
          level: 1,
          capacity: { status: "known", value: 1, observedTick: 600 }
        }
      ]
    };
    const pressured: AiObservationV1 = {
      ...f.observation,
      actors: [...f.observation.actors, enemy],
      threatSummary: {
        observedTick: 600,
        visibleEnemyActorIds: [enemy.actorId],
        rememberedEnemyActorIds: [],
        observedCapabilityFamilies: ["attack"]
      }
    };
    expect(f.manager.propose(pressured, f.state).intents).toEqual([]);
    const clear: AiObservationV1 = {
      ...pressured,
      actors: [...f.observation.actors, { ...enemy, visibility: "last_seen" }],
      threatSummary: { ...pressured.threatSummary, visibleEnemyActorIds: [], rememberedEnemyActorIds: [enemy.actorId] }
    };
    expect(f.manager.propose(clear, f.state).intents.filter((intent) => intent.kind === "construct")).toHaveLength(1);
  });
});
