import Phaser from "phaser";
import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { PRODUCTION_SPATIAL_AUTHORITY_EVENT, type ProductionSpatialAuthorityEvent } from
  "../../../world/services/multiplayer/production-spatial-authority-event";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { getActorComponent } from "../../../data/actor-component";
import { getGameObjectCurrentTile } from "../../../data/game-object-helper";
import { isSnapshotApplyInProgress } from "../../../data/scene-data";
import { BuilderComponent } from "../../../entity/components/construction/builder-component";
import { ConstructionSiteComponent } from "../../../entity/components/construction/construction-site-component";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { NavigationService } from "../../../world/services/navigation.service";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { AiRuntimeProductionSpatialCapture } from "./ai-runtime-production-spatial-capture";
import type { AiRuntimeProductionSpatialV1 } from "./ai-runtime-production-spatial-v1";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/game-object-helper", () => ({ getGameObjectCurrentTile: jest.fn() }));
jest.mock("../../../data/scene-data", () => ({ isSnapshotApplyInProgress: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));

/** Synthetic native service seam. No route query is added by observation and no live-world proof is claimed. */
function fixture() {
  const scene = { events: new Phaser.Events.EventEmitter(), sys: { isActive: () => true } } as unknown as Phaser.Scene;
  const source = { scene, active: true, name: ObjectNames.TivaraWorker } as Phaser.GameObjects.GameObject;
  const target = { scene, active: true, name: ObjectNames.TivaraSandhold } as Phaser.GameObjects.GameObject;
  let settle: (path: Vector2Simple[] | null) => void = () => { throw new Error("resolver_missing"); };
  const promise = new Promise<Vector2Simple[] | null>((resolve) => { settle = resolve; });
  const original = jest.fn(() => promise);
  const navigation = { findAndUseNavigablePathBetweenGameObjectsWithRadius: original } as unknown as NavigationService;
  const ticks = { currentTick: 10 };
  jest.mocked(getSceneService).mockImplementation((_scene, service) => {
    if (service === NavigationService) return navigation as never;
    if (service === SimulationTickService) return ticks as never;
    if (service === ActorIndexSystem) return { getActorById: (id: string) => id === "source" ? source : target } as never;
    return undefined;
  });
  jest.mocked(getActorComponent).mockImplementation((actor, component) => {
    if (component === IdComponent) return { id: actor === source ? "source" : "target" } as never;
    if (component === OwnerComponent) return { getOwner: () => 1 } as never;
    if (component === BuilderComponent && actor === source) return {} as never;
    if (component === ConstructionSiteComponent && actor === target) return { isFinished: false } as never;
    return undefined;
  });
  jest.mocked(getGameObjectCurrentTile).mockReturnValue({ x: 4, y: 5 });
  jest.mocked(isSnapshotApplyInProgress).mockReturnValue(false);
  const records: AiRuntimeProductionSpatialV1[] = [];
  const capture = new AiRuntimeProductionSpatialCapture(scene, () => "unused", (_player, value) => records.push(structuredClone(value)));
  return { scene, source, target, navigation, ticks, records, capture, original, promise, settle };
}

describe("production spatial capture", () => {
  it("retains native admission pricing in raw placement facts with missing-tech loss and disposal fencing", () => {
    const f = fixture();
    const event = { kind: "placement", site: f.target, footprint: [{ x: 7, y: 9 }], legal: true, admissionCost: { food: 7 },
      command: { type: "CONSTRUCT", tick: 10, playerNumber: 1, actorIds: ["source"], actorName: ObjectNames.TivaraSandhold,
        tileVec3: { x: 7, y: 9, z: 0 }, siteKey: "site:key" } } satisfies ProductionSpatialAuthorityEvent;
    f.scene.events.emit(PRODUCTION_SPATIAL_AUTHORITY_EVENT, event);
    expect(f.records[0]).toMatchObject({ kind: "placement", clockTick: 10,
      catalog: { priceSource: "shared_command_base_definition", admissionCost: { food: 7 }, siteDefinition: null },
      gaps: ["production_construction_effective_definition_missing"] });
    event.admissionCost.food = 99;
    expect(f.records[0]?.kind === "placement" && f.records[0].catalog?.admissionCost).toEqual({ food: 7 });
    f.capture.dispose(); f.scene.events.emit(PRODUCTION_SPATIAL_AUTHORITY_EVENT, event);
    expect(f.records).toHaveLength(1);
  });
  it("retains the original Promise and full empty/nonempty native result without issuing another query", async () => {
    const f = fixture();
    expect(f.original).not.toHaveBeenCalled();
    const returned = f.navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius(f.source, f.target, 1);
    expect(returned).toBe(f.promise);
    expect(f.records[0]).toMatchObject({ kind: "builder_path", phase: "requested", queryId: 1, clockTick: 10, radiusTiles: 1 });
    f.ticks.currentTick = 12;
    const path = [{ x: 4, y: 5 }, { x: 5, y: 5 }]; f.settle(path);
    expect(await returned).toBe(path);
    expect(f.records[1]).toMatchObject({ phase: "resolved", result: "path", path, clockTick: 12 });
    const point = path[0]; if (!point) throw new Error("synthetic_path_point_missing"); point.x = 99;
    const resolved = f.records[1];
    expect(resolved?.kind === "builder_path" && resolved.path?.[0]?.x).toBe(4);
    expect(f.original).toHaveBeenCalledTimes(1); f.capture.dispose();
    expect(f.navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius).toBe(f.original);
  });

  it("keeps a null result distinct from an empty successful path", async () => {
    for (const path of [null, []]) {
      const f = fixture(); const returned = f.navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius(f.source, f.target);
      f.settle(path); await returned;
      expect(f.records[1]).toMatchObject({ result: path === null ? "no_path" : "path", path });
      f.capture.dispose();
    }
  });

  it("fences late results and restores only its own wrapper", async () => {
    const f = fixture();
    const pending = f.navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius(f.source, f.target);
    const replacement = jest.fn(() => Promise.resolve(null));
    f.navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius = replacement;
    f.capture.dispose(); f.settle([]); await pending;
    expect(f.records).toHaveLength(1);
    expect(f.navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius).toBe(replacement);
    f.capture.dispose();
  });

  it("marks oversized successful results as loss, preserving the native result object", async () => {
    const f = fixture(); const returned = f.navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius(f.source, f.target);
    const path = Array.from({ length: 513 }, () => ({ x: 4, y: 5 })); f.settle(path);
    expect(await returned).toBe(path);
    expect(f.records[1]).toMatchObject({ result: "path", path: null, gaps: ["production_spatial_path_overflow"] });
    f.capture.dispose();
  });

  it("preserves native Promise rejection and synchronous throw without retrying the query", async () => {
    const f = fixture(); const error = new Error("native_path_failed");
    const rejected = Promise.reject<Vector2Simple[] | null>(error);
    f.original.mockImplementationOnce(() => rejected);
    const returned = f.navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius(f.source, f.target);
    expect(returned).toBe(rejected); await expect(returned).rejects.toBe(error);
    expect(f.records[1]).toMatchObject({ phase: "rejected", path: null, result: null });
    f.original.mockImplementationOnce(() => { throw error; });
    expect(() => f.navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius(f.source, f.target)).toThrow(error);
    expect(f.records[3]).toMatchObject({ phase: "threw", path: null, result: null });
    expect(f.original).toHaveBeenCalledTimes(2); f.capture.dispose();
  });
});
