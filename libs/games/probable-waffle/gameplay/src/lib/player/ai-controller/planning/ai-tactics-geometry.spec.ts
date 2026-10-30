import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { distance, formationPositions, safeRetreatPosition } from "./ai-tactics-geometry";

describe("safeRetreatPosition", () => {
  it("keeps a home-defense retreat near its protected base when local cover is available", () => {
    const observation = {
      actors: [
        {
          relation: "enemy",
          visibility: "visible",
          logicalPosition: { status: "known", value: { x: 35, y: 19, z: 0 } }
        }
      ],
      effects: [],
      map: {
        constructionCells: [
          { position: { x: 32, y: 19, z: 0 }, groundPassable: true, waterPassable: false, observedBlocked: false },
          { position: { x: 21, y: 7, z: 0 }, groundPassable: true, waterPassable: false, observedBlocked: false }
        ]
      }
    } as unknown as AiObservationV1;
    const state = {
      bases: [
        {
          baseId: "base:main:home",
          anchorActorId: "home",
          memberActorIds: ["home"],
          active: true,
          anchorPosition: { x: 33, y: 19, z: 0 }
        }
      ]
    } as unknown as AiBrainStateV1;

    expect(safeRetreatPosition(observation, state, [], "base:home")).toEqual({ x: 32, y: 19, z: 0 });
    expect(safeRetreatPosition(observation, state, [])).toEqual({ x: 21, y: 7, z: 0 });
  });

  it("keeps the whole home-defense retreat formation within twelve tiles of the protected base", () => {
    const observation = {
      actors: [
        {
          relation: "enemy",
          visibility: "visible",
          logicalPosition: { status: "known", value: { x: 35, y: 19, z: 0 } }
        }
      ],
      effects: [],
      map: {
        constructionCells: Array.from({ length: 50 }, (_, x) =>
          Array.from({ length: 50 }, (_, y) => ({
            position: { x, y, z: 0 },
            groundPassable: true,
            waterPassable: false,
            observedBlocked: false
          }))
        ).flat()
      }
    } as unknown as AiObservationV1;
    const state = {
      bases: [
        {
          baseId: "base:main:home",
          anchorActorId: "home",
          memberActorIds: ["home"],
          active: true,
          anchorPosition: { x: 33, y: 19, z: 0 }
        }
      ]
    } as unknown as AiBrainStateV1;
    const members = Array.from({ length: 8 }, (_, index) => ({
      actorId: `guard-${index}`,
      capabilities: [{ domains: ["ground"] }],
      combatProfile: {
        status: "known",
        value: { attacks: [{ minRange: 2 }] }
      }
    })) as unknown as Parameters<typeof formationPositions>[0];

    const retreat = safeRetreatPosition(observation, state, members, "base:home");
    expect(retreat).not.toBeNull();
    const assignments = formationPositions(members, retreat, observation);
    expect(assignments).toHaveLength(8);
    expect(assignments.every(({ position }) => distance(position, { x: 33, y: 19, z: 0 }) <= 12)).toBe(true);
  });
});

describe("formationPositions", () => {
  it("uses the next legal retreat slot after a native move to the prior slot fails", () => {
    const base = createAiTestObservation();
    const cells = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 }
    ].map(({ x, y }) => ({
      tileKey: `${x},${y}`,
      position: { x, y, z: 0 },
      groundPassable: true,
      waterPassable: false,
      elevation: 0,
      observedBlocked: false
    }));
    const observation = {
      ...base,
      map: { ...(base.map ?? {}), constructionCells: cells }
    } satisfies AiObservationV1;

    expect(
      formationPositions(
        [createAiTestOwnedActor("guard")],
        { x: 0, y: 0, z: 0 },
        observation,
        new Map([["guard", "1,0"]])
      )
    ).toEqual([{ actorId: "guard", position: { x: -1, y: 0, z: 0 } }]);
  });
});
