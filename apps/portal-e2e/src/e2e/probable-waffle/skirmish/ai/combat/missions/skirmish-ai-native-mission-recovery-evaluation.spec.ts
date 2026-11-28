import { expect, test } from "@playwright/test";
import {
  nativeRecoveryGroupAtThreat,
  nativeRecoveryNoSafeWindowClear
} from "./skirmish-ai-native-mission-recovery-evaluation";

function frame(
  positions: Record<string, { x: number; y: number }>,
  visibleThreats: string[],
  attackingIds: string[] = [],
  moveTarget?: { x: number; y: number }
) {
  return {
    tick: 800,
    decision: {
      input: {
        observation: {
          actors: [
            ...visibleThreats.map((actorId) => ({
              actorId,
              visibility: "visible",
              combatProfile: {
                status: "known",
                value: { attacks: [{ range: 7, highGroundRangeBonus: 2 }] }
              }
            })),
            ...Object.keys(positions)
              .filter((actorId) => !visibleThreats.includes(actorId))
              .map((actorId) => ({
                actorId,
                visibility: "owned",
                activeOrder: {
                  status: "known",
                  value: attackingIds.includes(actorId)
                    ? { orderType: "Attack", targetActorId: "guard" }
                    : moveTarget
                      ? { orderType: "Move", targetPosition: moveTarget }
                      : null
                }
              }))
          ]
        }
      }
    },
    tacticalBoundary: {
      actors: Object.entries(positions).map(([actorId, tile]) => ({
        identity: { actorId, alive: true },
        tile
      }))
    }
  } as never;
}

test("H-26 recognizes a paid group engaging the same visible choke threat", () => {
  expect(
    nativeRecoveryGroupAtThreat(
      frame(
        {
          guard: { x: 21, y: 20 },
          first: { x: 22, y: 20 },
          second: { x: 27, y: 20 },
          third: { x: 29, y: 17 },
          distant: { x: 40, y: 40 }
        },
        ["guard"],
        ["first", "second", "third"]
      ),
      ["first", "second", "third", "distant"],
      ["guard"]
    )
  ).toBe(true);
});

test("H-26 does not infer grouping from an unseen threat, scattered units or unrelated attack orders", () => {
  const positions = {
    guard: { x: 21, y: 20 },
    first: { x: 22, y: 20 },
    second: { x: 27, y: 20 },
    third: { x: 29, y: 17 }
  };
  expect(
    nativeRecoveryGroupAtThreat(
      frame(positions, [], ["first", "second", "third"]),
      ["first", "second", "third"],
      ["guard"]
    )
  ).toBe(false);
  expect(
    nativeRecoveryGroupAtThreat(
      frame(
        {
          guard: positions.guard,
          first: { x: 22, y: 20 },
          second: { x: 27, y: 20 },
          third: { x: 40, y: 40 }
        },
        ["guard"],
        ["first", "second", "third"]
      ),
      ["first", "second", "third"],
      ["guard"]
    )
  ).toBe(false);
  expect(
    nativeRecoveryGroupAtThreat(
      frame(positions, ["guard"], ["first", "second"]),
      ["first", "second", "third"],
      ["guard"]
    )
  ).toBe(false);
});

test("H-26 no-safe-route requires the late window and rejects an isolated unit in weapon range", () => {
  const safe = frame({ guard: { x: 20, y: 20 }, unit: { x: 40, y: 40 } }, ["guard"]);
  const early = Object.assign({}, safe, { tick: 200 });
  const exposed = frame({ guard: { x: 20, y: 20 }, unit: { x: 25, y: 20 } }, ["guard"]);
  const approaching = frame({ guard: { x: 20, y: 20 }, unit: { x: 40, y: 40 } }, ["guard"], [], { x: 21, y: 20 });
  expect(nativeRecoveryNoSafeWindowClear([early], ["unit"], ["guard"])).toBe(false);
  expect(nativeRecoveryNoSafeWindowClear([safe], ["unit"], ["guard"])).toBe(true);
  expect(nativeRecoveryNoSafeWindowClear([exposed], ["unit"], ["guard"])).toBe(false);
  expect(nativeRecoveryNoSafeWindowClear([approaching], ["unit"], ["guard"])).toBe(false);
});
