import Phaser from "phaser";
import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { getActorComponent } from "../../../data/actor-component";
import { getGameObjectCurrentTile } from "../../../data/game-object-helper";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { ProductionComponent } from "../../../entity/components/production/production-component";
import type { NavigationService } from "../../../world/services/navigation.service";
import { captureAiRuntimeCreatedActor } from "./capture-ai-runtime-created-actor";
import type { AiRuntimeProductionSpatialV1 } from "./ai-runtime-production-spatial-v1";
import { productionCaptureItem } from "./ai-runtime-production-capture-fixtures";
import { AiRuntimeProducerRouteCapture } from "./ai-runtime-producer-route-capture";
import { AiRuntimeNavigationObservation } from "./ai-runtime-navigation-observation";
import { NavigationProvenance } from "../../../world/services/navigation-provenance";
import type { NavigationNativeQuery } from "../../../world/services/navigation-native-query";
import { PawnAiController } from "../../../prefabs/ai-agents/pawn-ai-controller";
import { PawnAiBlackboard } from "../../../prefabs/ai-agents/pawn-ai-blackboard";
import { OrderData } from "../../../ai/OrderData";
import { OrderType } from "../../../ai/order-type";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/game-object-helper", () => ({ getGameObjectCurrentTile: jest.fn() }));
jest.mock("../../../entity/components/production/production-component", () => ({ ProductionComponent: class {} }));
jest.mock("./capture-ai-runtime-created-actor", () => ({ captureAiRuntimeCreatedActor: jest.fn() }));
jest.mock("../../../prefabs/ai-agents/pawn-ai-controller", () => ({ PawnAiController: class {} }));

/** Synthetic service instance and mutable result; proves only passive call/identity/disposal contracts once executed. */
function fixture() {
  const scene = {} as Phaser.Scene;
  const product = { scene, active: true, name: ObjectNames.TivaraWorker } as Phaser.GameObjects.GameObject;
  const producer = { scene, active: true, name: ObjectNames.TivaraSandhold } as Phaser.GameObjects.GameObject;
  const other = { scene, active: true, name: ObjectNames.TivaraWorker } as Phaser.GameObjects.GameObject;
  let settle: (path: Vector2Simple[] | null) => void = () => { throw new Error("resolver_missing"); };
  const promise = new Promise<Vector2Simple[] | null>((resolve) => { settle = resolve; });
  const object = jest.fn((..._args: Parameters<NavigationService["findAndUseNavigablePathBetweenGameObjectsWithRadius"]>) => promise);
  const tile = jest.fn((..._args: Parameters<NavigationService["findPathFromGameObjectToTile"]>) => promise);
  const dynamic = jest.fn((..._args: Parameters<NavigationService["findPathFromGameObjectToTileAvoidingDynamicBlockers"]>) => promise);
  const navigation = { findAndUseNavigablePathBetweenGameObjectsWithRadius: object,
    findPathFromGameObjectToTile: tile, findPathFromGameObjectToTileAvoidingDynamicBlockers: dynamic } as unknown as NavigationService;
  jest.mocked(getActorComponent).mockImplementation((actor, component) => {
    if (component === OwnerComponent) return { getOwner: () => 1 } as never;
    if (component === ProductionComponent && actor === producer) return {} as never;
    return undefined;
  });
  jest.mocked(captureAiRuntimeCreatedActor).mockImplementation((actor) => ({
    actorId: actor === producer ? "producer" : actor === product ? "product" : "other", objectName: actor.name,
    canonicalObjectName: actor.name, playerNumber: 1, active: true, alive: true, finished: true, indexed: true }));
  jest.mocked(getGameObjectCurrentTile).mockReturnValue({ x: 3, y: 4 });
  const records: AiRuntimeProductionSpatialV1[] = [];
  const capture = new AiRuntimeProducerRouteCapture(scene,
    () => ({ clockTick: 10, sceneActive: true, snapshotRestoreInProgress: false }),
    () => "actual:item", (_owner, value) => records.push(value));
  capture.install(navigation);
  const output = () => capture.observeOutput({ kind: "output", producer, product,
    item: { ...productionCaptureItem(), remainingTime: 0 }, rallyMode: "tile_action", target: null,
    targetTile: { x: 8, y: 9, z: 0 } });
  return { scene, product, producer, other, navigation, object, tile, dynamic, promise, settle, records, capture, output };
}

describe("passive producer service/output route capture", () => {
  it("samples actual current order identities at both boundaries while preserving the native Promise and one query", async () => {
    const f = fixture(), board = new PawnAiBlackboard();
    const previous = jest.mocked(getActorComponent).getMockImplementation();
    jest.mocked(getActorComponent).mockImplementation((actor, component) => component === PawnAiController ?
      { blackboard: board } as never : previous?.(actor, component));
    f.output();
    const first = new OrderData(OrderType.Move, { targetTileLocation: { x: 8, y: 9, z: 0 } });
    board.addOrder(first); board.setCurrentOrder(first);
    const returned = f.navigation.findPathFromGameObjectToTile(f.product, { x: 8, y: 9 });
    expect(returned).toBe(f.promise);
    const second = new OrderData(OrderType.Move, { targetTileLocation: { x: 8, y: 9, z: 0 } });
    board.setCurrentOrder(second); f.settle([]); await returned;
    const paths = f.records.filter((value) => value.kind === "producer_path");
    expect(paths).toMatchObject([{ currentOrder: { orderId: 1, admissionObserved: true } },
      { currentOrder: { orderId: 2, admissionObserved: false } }]);
    expect(f.tile).toHaveBeenCalledTimes(1); f.capture.dispose();
  });
  it("retains exact native water lookup lineage through the producer-output wrapper", async () => {
    const f = fixture(), provenance = new NavigationProvenance(); f.capture.dispose();
    f.scene.events = new Phaser.Events.EventEmitter();
    f.navigation.getHeightGraphDebugSnapshot = () => ({ cells: [], edgesByTileKey: new Map() });
    f.navigation.getNativeNavigationBoundary = () => provenance.sample();
    f.navigation.observeNativeNavigationQuery = (call, observer) => provenance.observe(call, observer);
    const observation = new AiRuntimeNavigationObservation(f.scene, f.navigation);
    const capture = new AiRuntimeProducerRouteCapture(f.scene,
      () => ({ clockTick: 10, sceneActive: true, snapshotRestoreInProgress: false }),
      () => "actual:item", (_owner, value) => f.records.push(value), observation);
    capture.install(f.navigation);
    capture.observeOutput({ kind: "output", producer: f.producer, product: f.product,
      item: { ...productionCaptureItem(), remainingTime: 0 }, rallyMode: "movement_fallback", target: null, targetTile: null });
    let query: NavigationNativeQuery | null = null;
    f.dynamic.mockImplementationOnce(() => {
      query = provenance.query("water_static", { x: 3, y: 4 }, { x: 8, y: 9 }, "miss", 10);
      return f.promise;
    });
    const returned = f.navigation.findPathFromGameObjectToTileAvoidingDynamicBlockers(f.product, { x: 8, y: 9 }, []);
    expect(returned).toBe(f.promise); provenance.completed(query); f.settle(null); await returned;
    expect(f.records[2]).toMatchObject({ method: "tile_dynamic", result: "no_path",
      nativeQuery: { queryId: 1, engine: "water_static", cache: "miss", requestTimeMs: 10 } });
    expect(f.dynamic).toHaveBeenCalledTimes(1); capture.dispose(); observation.dispose();
  });

  it("binds the returned object, preserves original Promise/arguments, and detaches before native path mutation", async () => {
    const f = fixture(); f.output();
    const destination = { x: 8, y: 9 };
    const returned = f.navigation.findPathFromGameObjectToTile(f.product, destination);
    expect(returned).toBe(f.promise); expect(f.tile).toHaveBeenCalledWith(f.product, destination);
    expect(f.records[1]).toMatchObject({ kind: "producer_path", outputId: 1, method: "tile_static", phase: "requested" });
    destination.x = 99;
    const path = [{ x: 3, y: 4 }, { x: 8, y: 9 }]; f.settle(path);
    expect(await returned).toBe(path); path.shift();
    expect(f.records[2]).toMatchObject({ phase: "resolved", path: [{ x: 3, y: 4 }, { x: 8, y: 9 }], targetTile: { x: 8, y: 9 } });
    expect(f.tile).toHaveBeenCalledTimes(1); expect(f.object).not.toHaveBeenCalled(); f.capture.dispose();
  });

  it("observes owned producer-target queries without inventing a production intent or querying unrelated tile moves", async () => {
    const f = fixture();
    const pending = f.navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius(f.other, f.producer, 2);
    expect(pending).toBe(f.promise);
    expect(f.records[0]).toMatchObject({ purpose: "producer_service", outputId: null, radiusTiles: 2 });
    f.navigation.findPathFromGameObjectToTile(f.other, { x: 8, y: 9 });
    f.settle([]); await pending;
    expect(f.records).toHaveLength(2); expect(f.tile).toHaveBeenCalledTimes(1); f.capture.dispose();
  });

  it("records only dynamic argument count and retains the native blocker array/result", async () => {
    const f = fixture(); f.output();
    const blockers: Parameters<NavigationService["findPathFromGameObjectToTileAvoidingDynamicBlockers"]>[2] = [];
    const returned = f.navigation.findPathFromGameObjectToTileAvoidingDynamicBlockers(f.product, { x: 8, y: 9 }, blockers);
    expect(returned).toBe(f.promise); expect(f.dynamic.mock.calls[0]?.[2]).toBe(blockers);
    f.settle(null); await returned;
    expect(f.records[2]).toMatchObject({ method: "tile_dynamic", dynamicBlockerCount: 0, result: "no_path", path: null });
    expect(f.records[2]).not.toHaveProperty("dynamicBlockers"); f.capture.dispose();
  });

  it("preserves synchronous native throws, rejected Promises and diagnostic-reader failure without retrying", async () => {
    const f = fixture(); f.output(); const error = new Error("native_failed");
    f.tile.mockImplementationOnce(() => { throw error; });
    expect(() => f.navigation.findPathFromGameObjectToTile(f.product, { x: 8, y: 9 })).toThrow(error);
    expect(f.tile).toHaveBeenCalledTimes(1); expect(f.records[2]).toMatchObject({ phase: "threw" });
    const rejected = Promise.reject<Vector2Simple[] | null>(error);
    f.tile.mockImplementationOnce(() => rejected);
    const pending = f.navigation.findPathFromGameObjectToTile(f.product, { x: 8, y: 9 });
    expect(pending).toBe(rejected); await expect(pending).rejects.toBe(error);
    expect(f.records[4]).toMatchObject({ phase: "rejected" });
    jest.mocked(getActorComponent).mockImplementationOnce(() => { throw new Error("diagnostic_read_failed"); });
    f.tile.mockImplementationOnce(() => { throw error; });
    expect(() => f.navigation.findPathFromGameObjectToTile(f.product, { x: 8, y: 9 })).toThrow(error);
    expect(f.tile).toHaveBeenCalledTimes(3); f.capture.dispose();
  });

  it("fences late callbacks and retains later method replacements while restoring other owned wrappers", async () => {
    const f = fixture(); f.output();
    const pending = f.navigation.findPathFromGameObjectToTile(f.product, { x: 8, y: 9 });
    const replacement = jest.fn(() => Promise.resolve(null));
    f.navigation.findPathFromGameObjectToTile = replacement;
    f.capture.dispose(); f.settle([]); await pending;
    expect(f.records).toHaveLength(2); expect(f.navigation.findPathFromGameObjectToTile).toBe(replacement);
    expect(f.navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius).toBe(f.object);
    expect(f.navigation.findPathFromGameObjectToTileAvoidingDynamicBlockers).toBe(f.dynamic);
    f.output(); expect(f.records).toHaveLength(2); f.capture.dispose();
  });

  it("limits output object bindings and path tiles without changing the native result", async () => {
    const f = fixture();
    for (let index = 0; index < 257; index++) f.output();
    expect(f.records[256]).toMatchObject({ kind: "output", gaps: ["production_route_output_binding_overflow"] });
    const pending = f.navigation.findPathFromGameObjectToTile(f.product, { x: 8, y: 9 });
    const path = Array.from({ length: 513 }, () => ({ x: 3, y: 4 })); f.settle(path);
    expect(await pending).toBe(path);
    expect(f.records[258]).toMatchObject({ result: "path", path: null, gaps: ["production_route_path_overflow"] });
    f.capture.dispose();
  });
});
