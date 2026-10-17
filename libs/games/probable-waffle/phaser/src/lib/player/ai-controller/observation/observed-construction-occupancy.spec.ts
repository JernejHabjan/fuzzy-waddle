import type Phaser from "phaser";
// prettier-ignore
import { createAiTestOwnedActor } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import { getTileCoordsUnderObject } from "../../../library/tile-under-object";
import { observedConstructionOccupancy } from "./observed-construction-occupancy";

jest.mock("../../../library/tile-under-object", () => ({ getTileCoordsUnderObject: jest.fn() }));

it("uses all current fair bodies without consulting hidden or last-seen live actors", () => {
  const owned = createAiTestOwnedActor("own"),
    seen = { ...createAiTestOwnedActor("seen"), visibility: "visible" as const };
  const stale = { ...createAiTestOwnedActor("stale"), visibility: "last_seen" as const };
  const objects = [owned, seen, stale, createAiTestOwnedActor("hidden")].map(
    (actor) => [actor.actorId, { name: actor.actorId } as Phaser.GameObjects.GameObject] as const
  );
  const live = new Map(objects);
  jest.mocked(getTileCoordsUnderObject).mockImplementation((_map, actor) =>
    actor.name === "own"
      ? [
          { x: 1, y: 2 },
          { x: 2, y: 2 }
        ]
      : [{ x: 3, y: 4 }]
  );
  expect([...observedConstructionOccupancy({} as Phaser.Tilemaps.Tilemap, [owned, seen, stale], live)]).toEqual([
    "1,2",
    "2,2",
    "3,4"
  ]);
  expect(jest.mocked(getTileCoordsUnderObject).mock.calls.map((call) => call[1].name)).toEqual(["own", "seen"]);
});
