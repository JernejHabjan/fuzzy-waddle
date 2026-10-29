import Phaser from "phaser";
import { getActorComponent } from "../../data/actor-component";
import { getTileCoordsUnderObject } from "../../library/tile-under-object";
import { ColliderComponent } from "../../entity/components/movement/collider-component";
import { NavigationObjectGrid } from "./navigation-object-grid";

jest.mock("../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../library/tile-under-object", () => ({ getTileCoordsUnderObject: jest.fn() }));

it("can omit transient colliders for persistent route-clearance projections", () => {
  const scene = {} as Phaser.Scene;
  const mobile = { active: true, scene, tile: { x: 0, y: 0 } } as Phaser.GameObjects.GameObject & {
    tile: { x: number; y: number };
  };
  const building = { active: true, scene, tile: { x: 1, y: 0 } } as Phaser.GameObjects.GameObject & {
    tile: { x: number; y: number };
  };
  const actors = [mobile, building];
  Reflect.set(scene, "children", { each: (visit: (actor: Phaser.GameObjects.GameObject) => void) => actors.forEach(visit) });
  const tilemap = { getTileAt: (x: number, y: number) => ({ x, y }) } as unknown as Phaser.Tilemaps.Tilemap;
  jest.mocked(getActorComponent).mockImplementation((actor, component) =>
    component === ColliderComponent ? ({ colliderDefinition: { enabled: true } } as never) : undefined
  );
  jest.mocked(getTileCoordsUnderObject).mockImplementation((_tilemap, actor) => [(actor as typeof mobile).tile]);

  const projection = new NavigationObjectGrid(scene, tilemap, false).build([[0, 0]], (actor) => actor !== mobile);

  expect(projection).toEqual([[undefined, 1]]);
});
