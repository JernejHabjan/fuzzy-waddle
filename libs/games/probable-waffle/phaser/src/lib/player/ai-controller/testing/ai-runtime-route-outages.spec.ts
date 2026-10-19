import type Phaser from "phaser";
import { Subject } from "rxjs";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { NavigationService } from "../../../world/services/navigation.service";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { installAiRuntimeRouteOutages, validAiRuntimeRouteOutages } from "./ai-runtime-route-outages";
import { recordAiRuntimePresetEventV1 } from "./ai-runtime-browser-test-config";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: () => ({ id: "original-mover" }) }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("./ai-runtime-browser-test-config", () => ({ recordAiRuntimePresetEventV1: jest.fn() }));

it("rejects missing roles, duplicate IDs and moving/unbounded outage deadlines", () => {
  const fault = { id: "finite-route-outage", fromTick: 400, throughTick: 800, fixtureActorIds: ["mover"] };
  expect(validAiRuntimeRouteOutages([fault], new Set(["mover"]))).toBe(true);
  for (const value of [[fault, fault], [{ ...fault, throughTick: 2000 }], [{ ...fault, fromTick: 0 }],
    [{ ...fault, fixtureActorIds: ["replacement"] }], [{ ...fault, fixtureActorIds: ["mover", "mover"] }]])
    expect(validAiRuntimeRouteOutages(value, new Set(["mover"]))).toBe(false);
});

it("scopes null responses to the original actor/window and restores owned methods without clobbering later hooks", async () => {
  const shutdown = new Subject<void>(), tick$ = new Subject<number>();
  const scene = { onShutdown: shutdown } as unknown as ProbableWaffleScene;
  const mover = { scene, name: "original" } as unknown as Phaser.GameObjects.GameObject;
  const other = { scene, name: "other" } as unknown as Phaser.GameObjects.GameObject;
  const nativePath = [{ x: 1, y: 2 }], basic = jest.fn(async () => nativePath), dynamic = jest.fn(async () => nativePath);
  const nav = { findPathFromGameObjectToTile: basic, findPathFromGameObjectToTileAvoidingDynamicBlockers: dynamic };
  const clock = { currentTick: 399, tick$ };
  jest.mocked(getSceneService).mockImplementation((_scene, service) =>
    (service === NavigationService ? nav : service === SimulationTickService ? clock : undefined) as never);
  installAiRuntimeRouteOutages(scene, { fixtureId: "finite-route-world", actors: [], resourceGrants: [],
    provenance: { sourceRevision: "a".repeat(40), fixtureDigest: "fnv1a32:12345678" },
    routeOutages: [{ id: "finite-route-outage", fromTick: 400, throughTick: 800, fixtureActorIds: ["mover"] }]
  }, new Map([["mover", mover]]));
  const retained = nav.findPathFromGameObjectToTile as NavigationService["findPathFromGameObjectToTile"];
  expect(await retained(mover, { x: 1, y: 2 })).toBe(nativePath);
  clock.currentTick = 400;
  expect(await retained(mover, { x: 1, y: 2 })).toBeNull();
  expect(await retained(other, { x: 1, y: 2 })).toBe(nativePath);
  expect(await retained(mover, { x: 1, y: 2 })).toBeNull();
  expect(recordAiRuntimePresetEventV1).toHaveBeenCalledTimes(1);
  const later = jest.fn(async () => nativePath);
  nav.findPathFromGameObjectToTile = later;
  clock.currentTick = 801;
  tick$.next(801);
  expect(nav.findPathFromGameObjectToTile).toBe(later);
  expect(nav.findPathFromGameObjectToTileAvoidingDynamicBlockers).toBe(dynamic);
  expect(await retained(mover, { x: 1, y: 2 })).toBe(nativePath);
  expect(tick$.observed).toBe(false);
  expect(shutdown.observed).toBe(false);
});
