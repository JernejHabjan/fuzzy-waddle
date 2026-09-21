import type { AiObservedActorV1, AiObservationV1 } from "../contracts/ai-observation-v1";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { selectAiAttackApproachPositions } from "./ai-tactics-approach-positions";

function attacker(actorId: string): AiObservedActorV1 {
  return {
    ...createAiTestOwnedActor(actorId),
    logicalPosition: { status: "known", value: { x: 0, y: 0, z: 0 }, observedTick: 100 },
    capabilities: [
      {
        id: `${actorId}:ground`,
        family: "military",
        level: 1,
        domains: ["ground"],
        targetDomains: ["ground"],
        capacity: { status: "known", value: 0, observedTick: 100 }
      }
    ]
  };
}

describe("observed attack approach positions", () => {
  it("uses remote tactical cells when construction cells cover only the home base", () => {
    const base = createAiTestObservation();
    const home = {
      tileKey: "0,0",
      position: { x: 0, y: 0, z: 0 },
      groundPassable: true,
      waterPassable: false,
      elevation: 0,
      observedBlocked: false
    };
    const approach = { ...home, tileKey: "21,20", position: { x: 21, y: 20, z: 0 } };
    const observation = {
      ...base,
      map: { ...base.map!, constructionCells: [home], tacticalCells: [approach] }
    } satisfies AiObservationV1;

    expect(selectAiAttackApproachPositions([attacker("a")], { x: 20, y: 20, z: 0 }, observation)).toEqual([
      { actorId: "a", position: approach.position }
    ]);
  });

  it("assigns distinct legal cells outside an occupied building footprint", () => {
    const target = { x: 10, y: 10, z: 0 };
    const base = createAiTestObservation();
    const cells = [
      {
        tileKey: "10,10",
        position: target,
        groundPassable: false,
        waterPassable: false,
        elevation: 0,
        observedBlocked: true
      },
      {
        tileKey: "9,10",
        position: { x: 9, y: 10, z: 0 },
        groundPassable: false,
        waterPassable: false,
        elevation: 0,
        observedBlocked: true
      },
      {
        tileKey: "7,10",
        position: { x: 7, y: 10, z: 0 },
        groundPassable: true,
        waterPassable: false,
        elevation: 0,
        observedBlocked: false
      },
      {
        tileKey: "7,11",
        position: { x: 7, y: 11, z: 0 },
        groundPassable: true,
        waterPassable: false,
        elevation: 0,
        observedBlocked: false
      }
    ];
    const observation = {
      ...base,
      map: {
        bounds: { status: "known" as const, value: { width: 20, height: 20 }, observedTick: 100 },
        staticRevision: 1,
        frontierAccessNodeIds: [],
        scoutCoverageAccessNodeIds: [],
        dynamicObstacleActorIds: [],
        regionGeneration: { generation: 1, status: "ready" as const, continuationCursor: 0 },
        constructionCells: cells
      }
    } satisfies AiObservationV1;

    const positions = selectAiAttackApproachPositions([attacker("a"), attacker("b")], target, observation);
    expect(positions).toHaveLength(2);
    expect(positions.map((entry) => entry.position)).toEqual([
      { x: 7, y: 10, z: 0 },
      { x: 7, y: 11, z: 0 }
    ]);
    expect(positions.every((entry) => entry.position.x !== target.x)).toBe(true);
  });
});
