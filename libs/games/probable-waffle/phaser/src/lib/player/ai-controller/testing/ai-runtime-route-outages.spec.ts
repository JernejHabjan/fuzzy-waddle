import type Phaser from "phaser";
import { EventEmitter } from "node:events";
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
  const scene = { onShutdown: shutdown, events: new EventEmitter() } as unknown as ProbableWaffleScene;
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

it.each([false, true])("releases retained native queries in request order, shutdown=%s", async (dispose) => {
  const shutdown = new Subject<void>(), tick$ = new Subject<number>();
  const scene = { onShutdown: shutdown, events: new EventEmitter() } as unknown as ProbableWaffleScene;
  const mover = { scene, name: "original" } as unknown as Phaser.GameObjects.GameObject;
  const order: number[] = [], basic = jest.fn(async (_actor, to: { x: number; y: number }) => {
    order.push(to.x); return [to];
  });
  const nav = { findPathFromGameObjectToTile: basic, findPathFromGameObjectToTileAvoidingDynamicBlockers: basic };
  const clock = { currentTick: 400, tick$ };
  jest.mocked(getSceneService).mockImplementation((_scene, service) =>
    (service === NavigationService ? nav : service === SimulationTickService ? clock : undefined) as never);
  installAiRuntimeRouteOutages(scene, { fixtureId: "pending-route-world", actors: [], resourceGrants: [],
    provenance: { sourceRevision: "a".repeat(40), fixtureDigest: "fnv1a32:12345678" },
    routeOutages: [{ id: "held-original-query", fromTick: 400, throughTick: 800,
      fixtureActorIds: ["mover"], mode: "pending" }]
  }, new Map([["mover", mover]]));
  const retained: NavigationService["findPathFromGameObjectToTile"] = nav.findPathFromGameObjectToTile;
  const first = retained(mover, { x: 1, y: 2 }), second = retained(mover, { x: 2, y: 2 });
  expect(basic).not.toHaveBeenCalled();
  clock.currentTick = 800; tick$.next(800);
  expect(basic).not.toHaveBeenCalled();
  if (dispose) scene.events.emit("shutdown");
  else { clock.currentTick = 801; tick$.next(801); }
  expect(await first).toEqual(dispose ? null : [{ x: 1, y: 2 }]);
  expect(await second).toEqual(dispose ? null : [{ x: 2, y: 2 }]);
  expect(order).toEqual(dispose ? [] : [1, 2]);
  expect(tick$.observed).toBe(false);
  expect(shutdown.observed).toBe(false);
  if (dispose) expect(await retained(mover, { x: 3, y: 2 })).toBeNull();
});

it("settles retained native queries on Phaser's destroy-only scene lifecycle", async () => {
  const shutdown = new Subject<void>(), tick$ = new Subject<number>(), events = new EventEmitter();
  const scene = { onShutdown: shutdown, events } as unknown as ProbableWaffleScene;
  const mover = { scene, name: "original" } as unknown as Phaser.GameObjects.GameObject;
  const basic = jest.fn(async () => [{ x: 1, y: 2 }]);
  const nav = { findPathFromGameObjectToTile: basic, findPathFromGameObjectToTileAvoidingDynamicBlockers: basic };
  const clock = { currentTick: 400, tick$ };
  jest.mocked(getSceneService).mockImplementation((_scene, service) =>
    (service === NavigationService ? nav : service === SimulationTickService ? clock : undefined) as never);
  installAiRuntimeRouteOutages(scene, { fixtureId: "destroy-pending-route-world", actors: [], resourceGrants: [],
    provenance: { sourceRevision: "a".repeat(40), fixtureDigest: "fnv1a32:12345678" },
    routeOutages: [{ id: "destroy-held-query", fromTick: 400, throughTick: 800,
      fixtureActorIds: ["mover"], mode: "pending" }]
  }, new Map([["mover", mover]]));
  const first = nav.findPathFromGameObjectToTile(mover, { x: 1, y: 2 });
  events.emit("destroy");
  await expect(first).resolves.toBeNull();
  expect(tick$.observed).toBe(false);
  expect(shutdown.observed).toBe(false);
});

it("settles retained native queries when the owning simulation clock completes", async () => {
  const shutdown = new Subject<void>(), tick$ = new Subject<number>();
  const scene = { onShutdown: shutdown, events: new EventEmitter() } as unknown as ProbableWaffleScene;
  const mover = { scene, name: "original" } as unknown as Phaser.GameObjects.GameObject;
  const basic = jest.fn(async () => [{ x: 1, y: 2 }]);
  const nav = { findPathFromGameObjectToTile: basic, findPathFromGameObjectToTileAvoidingDynamicBlockers: basic };
  const clock = { currentTick: 400, tick$ };
  jest.mocked(getSceneService).mockImplementation((_scene, service) =>
    (service === NavigationService ? nav : service === SimulationTickService ? clock : undefined) as never);
  installAiRuntimeRouteOutages(scene, { fixtureId: "clock-completion-world", actors: [], resourceGrants: [],
    provenance: { sourceRevision: "a".repeat(40), fixtureDigest: "fnv1a32:12345678" },
    routeOutages: [{ id: "clock-completion-query", fromTick: 400, throughTick: 800,
      fixtureActorIds: ["mover"], mode: "pending" }]
  }, new Map([["mover", mover]]));
  const pending = nav.findPathFromGameObjectToTile(mover, { x: 1, y: 2 });
  tick$.complete();
  await expect(pending).resolves.toBeNull();
  expect(basic).not.toHaveBeenCalled();
  expect(nav.findPathFromGameObjectToTile).toBe(basic);
  expect(shutdown.observed).toBe(false);
});

it("rejects unknown failure modes while retaining old null-response fixtures", () => {
  const entry = { id: "typed-query-failure", fromTick: 1, throughTick: 1001, fixtureActorIds: ["mover"] };
  for (const mode of [undefined, "null", "pending", "error"])
    expect(validAiRuntimeRouteOutages([{ ...entry, mode }], new Set(["mover"]))).toBe(true);
  for (const mode of ["forever", 0, null, ["pending"]])
    expect(validAiRuntimeRouteOutages([{ ...entry, mode }], new Set(["mover"]))).toBe(false);
});

/** Native seam fixture only; production route execution and scenario validity remain unrun. */
function failureFixture(mode: "pending" | "error") {
  const shutdown = new Subject<void>(), tick$ = new Subject<number>();
  const scene = { onShutdown: shutdown, events: new EventEmitter() } as unknown as ProbableWaffleScene;
  const mover = { scene, name: "original" } as unknown as Phaser.GameObjects.GameObject;
  const basic = jest.fn(async () => [{ x: 1, y: 2 }]);
  const nav = { findPathFromGameObjectToTile: basic, findPathFromGameObjectToTileAvoidingDynamicBlockers: basic };
  const clock = { currentTick: 400, tick$ };
  jest.mocked(getSceneService).mockImplementation((_scene, service) =>
    (service === NavigationService ? nav : service === SimulationTickService ? clock : undefined) as never);
  installAiRuntimeRouteOutages(scene, { fixtureId: "bounded-failure-world", actors: [], resourceGrants: [],
    provenance: { sourceRevision: "a".repeat(40), fixtureDigest: "fnv1a32:12345678" },
    routeOutages: [{ id: "original-service-fault", fromTick: 400, throughTick: 800, fixtureActorIds: ["mover"], mode }]
  }, new Map([["mover", mover]]));
  const call: NavigationService["findPathFromGameObjectToTile"] = nav.findPathFromGameObjectToTile;
  return { call, mover, basic, shutdown, tick$ };
}

it("reports explicit native query errors instead of converting them to unreachable terrain", async () => {
  const f = failureFixture("error");
  await expect(f.call(f.mover, { x: 1, y: 2 })).rejects.toThrow("runtime_route_service_error:original-service-fault");
  expect(f.basic).not.toHaveBeenCalled();
  f.shutdown.next();
  expect(f.tick$.observed).toBe(false);
});

it("caps held native calls and settles every original pending identity on shutdown", async () => {
  const f = failureFixture("pending");
  const calls = Array.from({ length: 32 }, (_, index) => f.call(f.mover, { x: index, y: 2 }));
  await expect(f.call(f.mover, { x: 40, y: 2 })).rejects.toThrow("runtime_route_pending_budget_exceeded");
  f.shutdown.next();
  expect(await Promise.all(calls)).toEqual(Array(32).fill(null));
  expect(f.basic).not.toHaveBeenCalled();
  expect(f.tick$.observed).toBe(false);
});
