import type Phaser from "phaser";
// prettier-ignore
import { createAiTestOwnedActor } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import { getTileCoordsUnderObject } from "../../../library/tile-under-object";
import { getActorComponent } from "../../../data/actor-component";
import { ActorTranslateComponent } from "../../../entity/components/movement/actor-translate-component";
import { ColliderComponent } from "../../../entity/components/movement/collider-component";
import { observedConstructionOccupancy, observedStaticConstructionOccupancy } from "./observed-construction-occupancy";

jest.mock("../../../library/tile-under-object", () => ({ getTileCoordsUnderObject: jest.fn() }));
jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));

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

it("keeps moving units out of static route blockers while retaining stationary visible bodies", () => {
  const building = createAiTestOwnedActor("building");
  const mover = createAiTestOwnedActor("mover");
  const buildingObject = {
    name: building.actorId,
    getData: () => undefined
  } as unknown as Phaser.GameObjects.GameObject;
  const moverObject = {
    name: mover.actorId,
    getData: () => ({ components: new Map([[ActorTranslateComponent, {}]]) })
  } as unknown as Phaser.GameObjects.GameObject;
  const live = new Map([
    [building.actorId, buildingObject],
    [mover.actorId, moverObject]
  ]);
  jest.mocked(getTileCoordsUnderObject).mockImplementation((_map, actor) =>
    actor.name === building.actorId ? [{ x: 2, y: 1 }] : [{ x: 2, y: 3 }]
  );
  jest.mocked(getActorComponent).mockImplementation((actor, componentClass) => {
    if (componentClass === ColliderComponent) return { colliderDefinition: { enabled: true } } as never;
    if (componentClass === ActorTranslateComponent && (actor as Phaser.GameObjects.GameObject).name === mover.actorId)
      return { name: "mover" } as never;
    return undefined;
  });

  expect([...observedStaticConstructionOccupancy({} as Phaser.Tilemaps.Tilemap, [building, mover], live)]).toEqual([
    "2,1"
  ]);
});
