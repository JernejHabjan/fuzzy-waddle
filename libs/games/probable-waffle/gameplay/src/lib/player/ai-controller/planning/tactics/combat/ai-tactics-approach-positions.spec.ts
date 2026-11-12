import type { AiObservedActor, AiObservation } from "../../../contracts/observation/ai-observation";
import {
  createAiTestObservation,
  createAiTestOwnedActor
} from "../../../testing/fixtures/coordination/ai-test-fixtures";
import { selectAiAttackApproachPositions, selectAiSafeFiringPositions } from "./ai-tactics-approach-positions";
import { combatActor } from "../../../testing/fixtures/tactics/ai-tactics-test-fixtures";

function attacker(actorId: string): AiObservedActor {
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
    } satisfies AiObservation;

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
        // Native tactical projection can fail to mark the observed objective's own tile blocked.
        groundPassable: true,
        waterPassable: false,
        elevation: 0,
        observedBlocked: false
      },
      {
        tileKey: "10,11",
        position: { x: 10, y: 11, z: 0 },
        groundPassable: true,
        waterPassable: false,
        elevation: 0,
        observedBlocked: false
      },
      {
        tileKey: "11,10",
        position: { x: 11, y: 10, z: 0 },
        groundPassable: true,
        waterPassable: false,
        elevation: 0,
        observedBlocked: false
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
    } satisfies AiObservation;

    const positions = selectAiAttackApproachPositions([attacker("a"), attacker("b")], target, observation, 1);
    expect(positions).toHaveLength(2);
    expect(positions.map((entry) => entry.position)).toEqual([
      { x: 7, y: 10, z: 0 },
      { x: 7, y: 11, z: 0 }
    ]);
    expect(positions.every((entry) => entry.position.x !== target.x)).toBe(true);
  });

  it("assigns attack slots by visible member geometry, independent of input actor order", () => {
    const base = createAiTestObservation();
    const cells = [
      { tileKey: "9,10", position: { x: 9, y: 10, z: 0 } },
      { tileKey: "10,9", position: { x: 10, y: 9, z: 0 } },
      { tileKey: "11,10", position: { x: 11, y: 10, z: 0 } },
      { tileKey: "10,11", position: { x: 10, y: 11, z: 0 } }
    ].map((cell) => ({
      ...cell,
      groundPassable: true,
      waterPassable: false,
      elevation: 0,
      observedBlocked: false
    }));
    const observation = {
      ...base,
      map: { ...base.map!, constructionCells: cells, tacticalCells: cells }
    } satisfies AiObservation;
    const members = [
      {
        ...attacker("a-east"),
        logicalPosition: { status: "known" as const, value: { x: 12, y: 10, z: 0 }, observedTick: 100 }
      },
      {
        ...attacker("z-west"),
        logicalPosition: { status: "known" as const, value: { x: 8, y: 10, z: 0 }, observedTick: 100 }
      }
    ];
    const target = { x: 10, y: 10, z: 0 };

    const first = selectAiAttackApproachPositions(members, target, observation);
    const reversed = selectAiAttackApproachPositions([...members].reverse(), target, observation);

    expect(first).toEqual(reversed);
    expect(first.map((assignment) => assignment.actorId)).toEqual(["z-west", "a-east"]);
    expect(new Set(first.map((assignment) => `${assignment.position.x},${assignment.position.y}`)).size).toBe(2);
  });

  it("keeps a still-legal attack slot when the moving formation changes its geometry", () => {
    const base = createAiTestObservation();
    const cells = [
      { tileKey: "9,10", position: { x: 9, y: 10, z: 0 } },
      { tileKey: "10,9", position: { x: 10, y: 9, z: 0 } },
      { tileKey: "11,10", position: { x: 11, y: 10, z: 0 } }
    ].map((cell) => ({
      ...cell,
      groundPassable: true,
      waterPassable: false,
      elevation: 0,
      observedBlocked: false
    }));
    const observation = {
      ...base,
      map: { ...base.map!, constructionCells: cells, tacticalCells: cells }
    } satisfies AiObservation;
    const target = { x: 10, y: 10, z: 0 };
    const member = {
      ...attacker("a"),
      logicalPosition: { status: "known" as const, value: { x: 8, y: 10, z: 0 }, observedTick: 100 }
    };
    const initial = selectAiAttackApproachPositions([member], target, observation);
    const advanced = {
      ...member,
      logicalPosition: { status: "known" as const, value: { x: 12, y: 10, z: 0 }, observedTick: 120 }
    };

    expect(selectAiAttackApproachPositions([advanced], target, observation)).not.toEqual(initial);
    expect(selectAiAttackApproachPositions([advanced], target, observation, 0, new Map(), initial)).toEqual(initial);
  });

  it("does not let a newly assigned member take an existing member's legal attack slot", () => {
    const base = createAiTestObservation();
    const cells = [
      { tileKey: "9,10", position: { x: 9, y: 10, z: 0 } },
      { tileKey: "11,10", position: { x: 11, y: 10, z: 0 } }
    ].map((cell) => ({
      ...cell,
      groundPassable: true,
      waterPassable: false,
      elevation: 0,
      observedBlocked: false
    }));
    const observation = {
      ...base,
      map: { ...base.map!, constructionCells: cells, tacticalCells: cells }
    } satisfies AiObservation;
    const target = { x: 10, y: 10, z: 0 };
    const existing = {
      ...attacker("existing"),
      logicalPosition: { status: "known" as const, value: { x: 12, y: 10, z: 0 }, observedTick: 100 }
    };
    const previous = selectAiAttackApproachPositions([existing], target, observation);
    const newcomer = {
      ...attacker("newcomer"),
      logicalPosition: { status: "known" as const, value: { x: 8, y: 10, z: 0 }, observedTick: 120 }
    };

    const assignments = selectAiAttackApproachPositions(
      [newcomer, existing],
      target,
      observation,
      0,
      new Map(),
      previous
    );

    expect(assignments.find((assignment) => assignment.actorId === "existing")?.position).toEqual(
      previous[0]?.position
    );
    expect(assignments.find((assignment) => assignment.actorId === "newcomer")?.position).toEqual({
      x: 9,
      y: 10,
      z: 0
    });
  });

  it("replaces an old attack slot after the target moves beyond its approach range", () => {
    const base = createAiTestObservation();
    const cells = [
      { tileKey: "9,10", position: { x: 9, y: 10, z: 0 } },
      { tileKey: "29,30", position: { x: 29, y: 30, z: 0 } }
    ].map((cell) => ({
      ...cell,
      groundPassable: true,
      waterPassable: false,
      elevation: 0,
      observedBlocked: false
    }));
    const observation = {
      ...base,
      map: { ...base.map!, constructionCells: cells, tacticalCells: cells }
    } satisfies AiObservation;
    const member = attacker("a");
    const previous = [{ actorId: member.actorId, position: cells[0]!.position }];

    expect(
      selectAiAttackApproachPositions([member], { x: 30, y: 30, z: 0 }, observation, 0, new Map(), previous)
    ).toEqual([{ actorId: member.actorId, position: cells[1]!.position }]);
  });

  it("skips a nearer assault cell when the actor's known ground region cannot reach it", () => {
    const base = createAiTestObservation();
    const member = {
      ...attacker("a"),
      accessNodeId: { status: "known" as const, value: "home" as never, observedTick: 100 }
    };
    const unreachable = {
      tileKey: "19,20",
      position: { x: 19, y: 20, z: 0 },
      groundPassable: true,
      waterPassable: false,
      elevation: 0,
      observedBlocked: false,
      groundAccessNodeId: "island" as never
    };
    const reachable = {
      ...unreachable,
      tileKey: "21,20",
      position: { x: 21, y: 20, z: 0 },
      groundAccessNodeId: "bridge" as never
    };
    const observation = {
      ...base,
      map: {
        ...base.map!,
        tacticalCells: [unreachable, reachable],
        accessGraph: {
          schemaVersion: 1 as const,
          generation: 1,
          status: "ready" as const,
          staticRevision: 1,
          dynamicRevision: 1,
          threatRevision: 1,
          builtTick: 100,
          continuationCursor: 0,
          nodes: ["home", "bridge", "island"].map((nodeId) => ({
            nodeId: nodeId as never,
            domain: "ground" as const,
            elevation: 0,
            knowledge: "known_static" as const,
            representativePosition: { x: 0, y: 0, z: 0 },
            tileCount: 1,
            clearance: 1
          })),
          links: [
            {
              linkId: "home-bridge",
              fromNodeId: "home" as never,
              toNodeId: "bridge" as never,
              domain: "ground" as const,
              clearance: 1,
              distanceCost: 1,
              knowledge: "known_static" as const
            }
          ],
          transferPoints: [],
          unknownNodeIds: []
        }
      }
    } satisfies AiObservation;

    expect(selectAiAttackApproachPositions([member], { x: 20, y: 20, z: 0 }, observation)).toEqual([
      { actorId: "a", position: reachable.position }
    ]);
  });

  it("replaces an attack slot that failed its native move", () => {
    const base = createAiTestObservation();
    const first = {
      tileKey: "19,20",
      position: { x: 19, y: 20, z: 0 },
      groundPassable: true,
      waterPassable: false,
      elevation: 0,
      observedBlocked: false
    };
    const next = { ...first, tileKey: "20,19", position: { x: 20, y: 19, z: 0 } };
    const map = base.map ?? ({} as NonNullable<AiObservation["map"]>);
    const observation = {
      ...base,
      map: { ...map, tacticalCells: [first, next] }
    } satisfies AiObservation;

    expect(
      selectAiAttackApproachPositions(
        [attacker("a")],
        { x: 20, y: 20, z: 0 },
        observation,
        0,
        new Map([["a", "19,20"]])
      )
    ).toEqual([{ actorId: "a", position: next.position }]);
  });

  it("moves an air attacker to visible weapon range when the observation has no tactical cells", () => {
    const base = createAiTestObservation();
    const airAttacker = combatActor("air", "self", 0, "air", 1000, { damage: 9 });
    const observation = {
      ...base,
      map: { ...base.map!, tacticalCells: [], constructionCells: [] }
    } satisfies AiObservation;

    const positions = selectAiAttackApproachPositions([airAttacker], { x: 10, y: 0, z: 0 }, observation);

    expect(positions).toHaveLength(1);
    expect(Math.hypot(positions[0]!.position.x - 10, positions[0]!.position.y)).toBeLessThanOrEqual(4);
  });

  it("selects a legal firing tile with room beyond observed enemy weapon ranges", () => {
    const base = createAiTestObservation();
    const member = combatActor("wounded-ranged", "self", 1, "ground", 400);
    const enemyBase = combatActor("nearby-enemy", "enemy", 2, "ground", 1000);
    const enemyProfile = enemyBase.combatProfile.status === "known" ? enemyBase.combatProfile.value : undefined;
    const enemy = {
      ...enemyBase,
      combatProfile: {
        ...enemyBase.combatProfile,
        value: {
          ...enemyProfile!,
          attacks: enemyProfile!.attacks.map((attack) => ({ ...attack, range: 1, minRange: 0 }))
        }
      }
    };
    const target = combatActor("objective", "enemy", 12, "ground", 1000, { damage: 0 });
    const firingTile = {
      tileKey: "7,0",
      position: { x: 7, y: 0, z: 0 },
      groundPassable: true,
      waterPassable: false,
      elevation: 0,
      observedBlocked: false
    };
    const saferFiringTile = { ...firingTile, tileKey: "9,0", position: { x: 9, y: 0, z: 0 } };
    const observation = {
      ...base,
      actors: [member, enemy, target],
      map: { ...base.map!, tacticalCells: [firingTile, saferFiringTile] }
    } satisfies AiObservation;

    expect(selectAiSafeFiringPositions([member], [enemy, target], target, observation)).toEqual([
      { actorId: member.actorId, position: firingTile.position }
    ]);
    expect(
      selectAiSafeFiringPositions(
        [{ ...member, healthPermille: { status: "known", value: 401, observedTick: 100 } }],
        [
          {
            ...enemy,
            logicalPosition: { status: "known", value: firingTile.position, observedTick: 100 },
            combatProfile: {
              ...enemy.combatProfile,
              value: {
                ...enemyProfile!,
                attacks: enemyProfile!.attacks.map((attack) => ({ ...attack, range: 5, minRange: 0 }))
              }
            }
          }
        ],
        target,
        observation
      )
    ).toEqual([]);
  });

  it("moves a nearly defeated ranged actor to the farthest legal standoff tile", () => {
    const base = createAiTestObservation();
    const member = combatActor("critical-ranged", "self", 1, "ground", 300);
    const enemy = combatActor("pursuer", "enemy", 2, "ground", 1000);
    const target = combatActor("objective", "enemy", 5, "ground", 1000, { damage: 0 });
    const retreatTile = {
      tileKey: "12,0",
      position: { x: 12, y: 0, z: 0 },
      groundPassable: true,
      waterPassable: false,
      elevation: 0,
      observedBlocked: false
    };
    const observation = {
      ...base,
      actors: [member, enemy, target],
      map: { ...base.map!, tacticalCells: [retreatTile] }
    } satisfies AiObservation;

    expect(selectAiSafeFiringPositions([member], [enemy, target], target, observation)).toEqual([
      { actorId: member.actorId, position: retreatTile.position }
    ]);
  });
});
