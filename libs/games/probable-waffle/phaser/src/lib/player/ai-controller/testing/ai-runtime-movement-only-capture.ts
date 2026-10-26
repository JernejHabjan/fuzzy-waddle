import Phaser from "phaser";
import { isSnapshotApplyInProgress } from "../../../data/scene-data";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { NavigationService } from "../../../world/services/navigation.service";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { getActorComponent } from "../../../data/actor-component";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { getGameObjectCurrentTile } from "../../../data/game-object-helper";
import type { AiRuntimeProductionCaptureV1 } from "./ai-runtime-production-capture-v1";
import type { AiRuntimeProductionFactV1 } from "./ai-runtime-production-fact-v1";
import type { AiRuntimeProductionSpatialV1 } from "./ai-runtime-production-spatial-v1";
import { AiRuntimeRouteOrderCapture } from "./ai-runtime-route-order-capture";

const MAX_FACTS = 4_096;
const MAX_MOVEMENT_QUERIES = 256;
const MAX_HEIGHT_ROUTE_INSPECTIONS = 32;
const FOCUS_ACTOR_IDS = new Set([
  "sim-ef33c9b4",
  "sim-b755739d",
  "sim-c3a0897c",
  "sim-9eef2c4c",
  "sim-d7b2ec6a",
  "sim-a2f93e2d",
  "sim-5ceebb17",
  "sim-6617cdb2",
  "sim-75b964cf",
  "sim-7627d1ed",
  "sim-84c885cf",
  "sim-8c9c58c5",
  "sim-df2fcd81"
]);

/** Test-only bounded recorder for move completion and the order that caused it. */
export class AiRuntimeMovementOnlyCapture {
  private readonly facts: AiRuntimeProductionFactV1[] = [];
  private readonly movementQueries: NonNullable<AiRuntimeProductionCaptureV1["movementQueries"]>[number][] = [];
  private readonly dropped = new Map<number, number>();
  private readonly subscriptions: { unsubscribe(): void }[] = [];
  private nextSequence = 1;
  private movementQueriesStarted = 0;
  private heightRouteInspections = 0;
  private disposed = false;
  private readonly routes: AiRuntimeRouteOrderCapture;
  private readonly startedTick: number;
  private readonly restoreNavigation: (() => void)[] = [];

  constructor(private readonly scene: Phaser.Scene) {
    this.startedTick = getSceneService(scene, SimulationTickService)?.currentTick ?? 0;
    this.routes = new AiRuntimeRouteOrderCapture(scene, () => this.boundary(), (owner, spatial) => {
      const actorId = "source" in spatial ? spatial.source.actorId : null;
      if (actorId && FOCUS_ACTOR_IDS.has(actorId) &&
        (spatial.kind === "movement" || spatial.kind === "route_order" || spatial.kind === "route_order_restore"))
        this.append(owner, spatial);
    });
    const index = getSceneService(scene, ActorIndexSystem);
    if (index) {
      this.subscriptions.push(index.actorRegistered.subscribe((actor) => this.routes.watchActor(actor)));
      this.subscriptions.push(index.actorUnregistered.subscribe((actor) => this.routes.unwatchActor(actor)));
      this.subscriptions.push(index.actorOwnershipChanged.subscribe(({ actor }) => this.routes.watchActor(actor)));
      index.getAllIdActors().forEach((actor) => this.routes.watchActor(actor));
    }
    const navigation = getSceneService(scene, NavigationService);
    if (navigation) this.observeMovementQueries(navigation);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.dispose, this);
    scene.events.once(Phaser.Scenes.Events.DESTROY, this.dispose, this);
  }

  capture(playerNumber: number): AiRuntimeProductionCaptureV1 {
    if (this.disposed) throw new Error("movement_capture_disposed");
    return {
      schemaVersion: 1,
      kind: "production_authority_capture",
      startedTick: this.startedTick,
      playerNumber,
      droppedFactCount: this.dropped.get(playerNumber) ?? 0,
      droppedSnapshotCount: 0,
      gaps: [],
      facts: this.facts.filter((fact) => fact.playerNumber === playerNumber),
      movementQueries: this.movementQueries.filter((query) => query.playerNumber === playerNumber),
      snapshots: []
    };
  }

  captureHumanQueueBoundary(playerNumber: number): AiRuntimeProductionCaptureV1 {
    return this.capture(playerNumber);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.routes.dispose();
    this.restoreNavigation.reverse().forEach((restore) => restore());
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.dispose, this);
    this.scene.events.off(Phaser.Scenes.Events.DESTROY, this.dispose, this);
  }

  private append(playerNumber: number, spatial: AiRuntimeProductionSpatialV1): void {
    if (this.disposed) return;
    if (this.facts.length >= MAX_FACTS) {
      this.dropped.set(playerNumber, (this.dropped.get(playerNumber) ?? 0) + 1);
      return;
    }
    this.facts.push({ sequence: this.nextSequence++, tick: this.boundary().clockTick ?? 0,
      playerNumber, kind: "spatial_authority", spatial: structuredClone(spatial) });
  }

  private boundary() {
    return { clockTick: getSceneService(this.scene, SimulationTickService)?.currentTick ?? null,
      snapshotRestoreInProgress: isSnapshotApplyInProgress(this.scene), sceneActive: this.scene.sys?.isActive() ?? false };
  }

  private observeMovementQueries(navigation: NavigationService): void {
    const wrap = (method: "tile_static" | "tile_dynamic") => {
      const key = method === "tile_static" ? "findPathFromGameObjectToTile" :
        "findPathFromGameObjectToTileAvoidingDynamicBlockers";
      const original = navigation[key] as (...args: any[]) => Promise<{ x: number; y: number }[] | null>;
      if (typeof original !== "function") return;
      const wrapper = (...args: any[]) => {
        const actor = args[0] as Phaser.GameObjects.GameObject;
        const destination = args[1] as { x: number; y: number };
        const owner = getActorComponent(actor, OwnerComponent)?.getOwner();
        const actorId = getActorComponent(actor, IdComponent)?.id ?? null;
        if (!actorId || !FOCUS_ACTOR_IDS.has(actorId)) return original.apply(navigation, args);
        const queryTick = this.boundary().clockTick ?? 0;
        if (this.movementQueriesStarted >= MAX_MOVEMENT_QUERIES) return original.apply(navigation, args);
        this.movementQueriesStarted++;
        const sourceTile = this.getCurrentTile(actor);
        const dynamicBlockerCount = method === "tile_dynamic" && Array.isArray(args[2]) ? args[2].length : null;
        const record = (result: "path" | "no_path" | "threw", path: { x: number; y: number }[] | null) => {
          if (this.disposed || owner === undefined || this.movementQueries.length >= MAX_MOVEMENT_QUERIES) return;
          const inspectConnectivity = result === "no_path" && this.heightRouteInspections < MAX_HEIGHT_ROUTE_INSPECTIONS;
          if (inspectConnectivity) this.heightRouteInspections++;
          const route = sourceTile
            ? this.inspectHeightRoute(navigation, sourceTile, destination, inspectConnectivity)
            : { sourceNavigable: null, targetNavigable: null, heightGraphReachable: null };
          const lastStep = path?.at(-1);
          this.movementQueries.push({ tick: queryTick, playerNumber: owner, actorId, method, sourceTile,
            targetTile: { x: destination.x, y: destination.y }, dynamicBlockerCount, result,
            pathLength: path?.length ?? (result === "no_path" ? 0 : null),
            firstStep: path?.[0] ? { x: path[0].x, y: path[0].y } : null,
            lastStep: lastStep ? { x: lastStep.x, y: lastStep.y } : null,
            pathTiles: path?.map((tile) => ({ x: tile.x, y: tile.y })) ?? null, ...route });
        };
        let promise: Promise<{ x: number; y: number }[] | null>;
        try { promise = original.apply(navigation, args); }
        catch (error) { record("threw", null); throw error; }
        void promise.then((path) => record(path === null ? "no_path" : "path", path), () => record("threw", null))
          .catch(() => undefined);
        return promise;
      };
      (navigation as any)[key] = wrapper;
      this.restoreNavigation.push(() => { if ((navigation as any)[key] === wrapper) (navigation as any)[key] = original; });
    };
    wrap("tile_static");
    wrap("tile_dynamic");
  }

  private getCurrentTile(actor: Phaser.GameObjects.GameObject): { x: number; y: number } | null {
    try {
      return getGameObjectCurrentTile(actor) ?? null;
    } catch { /* Position is also present on the adjacent movement event. */ }
    return null;
  }

  private inspectHeightRoute(navigation: NavigationService, source: { x: number; y: number },
    target: { x: number; y: number }, inspectConnectivity = true) {
    try {
      const graph = navigation.getHeightGraphDebugSnapshot();
      if (!graph) return { sourceNavigable: null, targetNavigable: null, heightGraphReachable: null };
      const sourceCell = graph.cells[source.y]?.[source.x], targetCell = graph.cells[target.y]?.[target.x];
      if (!sourceCell?.isNavigable || !targetCell?.isNavigable) return {
        sourceNavigable: sourceCell?.isNavigable ?? false,
        targetNavigable: targetCell?.isNavigable ?? false,
        heightGraphReachable: false
      };
      if (!inspectConnectivity)
        return { sourceNavigable: true, targetNavigable: true, heightGraphReachable: null };
      const seen = new Set<string>([`${source.x},${source.y}`]), pending = [{ x: source.x, y: source.y }];
      for (let cursor = 0; cursor < pending.length; cursor++) {
        const current = pending[cursor]!;
        if (current.x === target.x && current.y === target.y) return {
          sourceNavigable: true, targetNavigable: true, heightGraphReachable: true
        };
        for (const edge of graph.edgesByTileKey.get(`${current.x},${current.y}`) ?? []) {
          const key = `${edge.to.x},${edge.to.y}`;
          if (!seen.has(key)) { seen.add(key); pending.push(edge.to); }
        }
      }
      return { sourceNavigable: true, targetNavigable: true, heightGraphReachable: false };
    } catch {
      return { sourceNavigable: null, targetNavigable: null, heightGraphReachable: null };
    }
  }
}
