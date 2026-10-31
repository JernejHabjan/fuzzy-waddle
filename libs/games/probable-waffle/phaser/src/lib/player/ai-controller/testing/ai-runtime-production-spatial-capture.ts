import type Phaser from "phaser";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { getActorComponent } from "../../../data/actor-component";
import { getGameObjectCurrentTile } from "../../../data/game-object-helper";
import { isSnapshotApplyInProgress } from "../../../data/scene-data";
import { BuilderComponent } from "../../../entity/components/construction/builder-component";
import { ConstructionSiteComponent } from "../../../entity/components/construction/construction-site-component";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { NavigationService } from "../../../world/services/navigation.service";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import {
  PRODUCTION_SPATIAL_AUTHORITY_EVENT,
  type ProductionSpatialAuthorityEvent
} from "../../../world/services/multiplayer/production-spatial-authority-event";
import { captureAiRuntimeCreatedActor } from "./capture-ai-runtime-created-actor";
import { captureAiRuntimeProductionItem } from "./ai-runtime-production-item";
import type { AiRuntimeProductionSpatialV1 } from "./ai-runtime-production-spatial-v1";
import { captureAiRuntimeConstructionCatalog } from "./capture-ai-runtime-construction-catalog";
import { AiRuntimeProducerRouteCapture } from "./ai-runtime-producer-route-capture";
import { AiRuntimeNavigationObservation } from "./ai-runtime-navigation-observation";
import type { AiRuntimeResourceCoverageCapture } from "./ai-runtime-resource-coverage-capture";
import type { AiRuntimeProtectedRouteV1 } from "./ai-runtime-protected-route-v1";
import { captureAiRuntimePlacementClearance } from "./capture-ai-runtime-placement-clearance";

/** Test-owned service observation. Queries run once, return their original Promise and never feed an AI planner. */
export class AiRuntimeProductionSpatialCapture {
  private static readonly MAX_HEIGHT_ROUTE_INSPECTIONS = 32;
  private disposed = false;
  private nextQueryId = 1;
  private heightRouteInspections = 0;
  private restoreNavigation?: () => void;
  private producerRoutes?: AiRuntimeProducerRouteCapture;
  private navigationObservation?: AiRuntimeNavigationObservation;
  private clearanceReads = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly identify: (actorId: string, item: UnifiedQueueItem) => string,
    private readonly append: (playerNumber: number, spatial: AiRuntimeProductionSpatialV1) => void,
    coverage?: AiRuntimeResourceCoverageCapture,
    private readonly protectedRoutes: readonly AiRuntimeProtectedRouteV1[] = []
  ) {
    scene.events.on(PRODUCTION_SPATIAL_AUTHORITY_EVENT, this.observeNative, this);
    const navigation = getSceneService(scene, NavigationService);
    if (navigation) this.navigationObservation = new AiRuntimeNavigationObservation(scene, navigation);
    this.producerRoutes = new AiRuntimeProducerRouteCapture(
      scene,
      () => this.boundary(),
      identify,
      append,
      this.navigationObservation,
      coverage
    );
    if (navigation) {
      this.producerRoutes.install(navigation);
      this.observeNavigation(navigation);
    }
  }

  /** Restore only our installed method, preserving a later owner's replacement; pending callbacks are fenced. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.restoreNavigation?.();
    this.producerRoutes?.dispose();
    this.navigationObservation?.dispose();
    this.scene.events.off(PRODUCTION_SPATIAL_AUTHORITY_EVENT, this.observeNative, this);
  }

  private boundary() {
    return {
      clockTick: getSceneService(this.scene, SimulationTickService)?.currentTick ?? null,
      snapshotRestoreInProgress: isSnapshotApplyInProgress(this.scene),
      sceneActive: this.scene.sys?.isActive() ?? false
    };
  }

  watchActor(actor: Phaser.GameObjects.GameObject): void {
    this.producerRoutes?.orders.watchActor(actor);
  }
  unwatchActor(actor: Phaser.GameObjects.GameObject): void {
    this.producerRoutes?.orders.unwatchActor(actor);
  }

  private readonly observeNative = (event: ProductionSpatialAuthorityEvent): void => {
    if (this.disposed) return;
    if (event.kind === "placement") {
      if (event.site.scene !== this.scene) return;
      const footprint = event.footprint.length <= 128 ? event.footprint : null;
      const pricing = captureAiRuntimeConstructionCatalog(event);
      const routes = this.protectedRoutes.filter((route) => route.playerNumber === event.command.playerNumber);
      const clearance = routes.length
        ? ++this.clearanceReads <= 256
          ? captureAiRuntimePlacementClearance(this.scene, routes)
          : { ...this.boundary(), gaps: ["placement_clearance_prefix_overflow"], routes: [] }
        : undefined;
      this.append(event.command.playerNumber, {
        ...this.boundary(),
        kind: "placement",
        command: event.command,
        site: captureAiRuntimeCreatedActor(event.site),
        footprint,
        legal: event.legal,
        catalog: pricing.catalog,
        clearance,
        gaps: [...pricing.gaps, ...(footprint ? [] : ["production_spatial_footprint_overflow"])]
      });
    } else if (event.kind === "output") {
      this.producerRoutes?.observeOutput(event);
    } else {
      const producer = captureAiRuntimeCreatedActor(event.producer);
      if (event.producer.scene !== this.scene || producer.playerNumber === null || !producer.actorId) return;
      this.append(producer.playerNumber, {
        ...this.boundary(),
        kind: "spawn",
        producer,
        item: captureAiRuntimeProductionItem(producer.actorId, event.item, this.identify),
        waterUnit: event.waterUnit,
        tile: event.tile,
        position: event.position,
        gaps: []
      });
    }
  };

  private observeNavigation(navigation: NavigationService): void {
    const original = navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius;
    const wrapper: typeof original = (...args) => {
      if (this.disposed || this.nextQueryId > 8192) return original.apply(navigation, args);
      const [source, target, radius] = args;
      let playerNumber: number | undefined;
      let snapshot:
        | (() => Pick<
            Extract<AiRuntimeProductionSpatialV1, { kind: "builder_path" }>,
            | "clockTick"
            | "snapshotRestoreInProgress"
            | "sceneActive"
            | "kind"
            | "queryId"
            | "navigation"
            | "source"
            | "target"
            | "sourceTile"
            | "targetTile"
            | "radiusTiles"
          >)
        | undefined;
      try {
        playerNumber = getActorComponent(source, OwnerComponent)?.getOwner();
        if (
          source.scene === this.scene &&
          target.scene === this.scene &&
          playerNumber !== undefined &&
          getActorComponent(target, OwnerComponent)?.getOwner() === playerNumber &&
          getActorComponent(source, BuilderComponent) &&
          getActorComponent(target, ConstructionSiteComponent)
        ) {
          const queryId = this.nextQueryId++;
          snapshot = () => ({
            ...this.boundary(),
            kind: "builder_path",
            queryId,
            navigation: this.navigationObservation?.sample(),
            source: captureAiRuntimeCreatedActor(source),
            target: captureAiRuntimeCreatedActor(target),
            sourceTile: getGameObjectCurrentTile(source) ?? null,
            targetTile: getGameObjectCurrentTile(target) ?? null,
            radiusTiles: radius ?? null
          });
          this.append(playerNumber, { ...snapshot(), phase: "requested", path: null, result: null, gaps: [] });
        }
      } catch {
        snapshot = undefined;
      }
      if (!snapshot || playerNumber === undefined) return original.apply(navigation, args);
      const captured = snapshot,
        owner = playerNumber;
      const native = this.navigationObservation?.query();
      let promise: ReturnType<typeof original>;
      try {
        const call = () => original.apply(navigation, args);
        promise = native ? native.invoke(call) : call();
      } catch (error) {
        try {
          this.append(owner, {
            ...captured(),
            nativeQuery: native?.sample(),
            phase: "threw",
            path: null,
            result: null,
            gaps: []
          });
        } catch {
          /* Preserve the original native error, including a failed diagnostic reader. */
        }
        this.navigationObservation?.release(native);
        throw error;
      }
      // Subscribe before the caller awaits, retaining the exact Promise, result object and native rejection.
      void promise
        .then(
          (path) => {
            if (this.disposed) return;
            const bounded = path === null || path.length <= 512;
            const entry = captured();
            const route = path === null ? this.inspectHeightRoute(navigation, entry.sourceTile, entry.targetTile) : {};
            this.append(owner, {
              ...entry,
              ...route,
              nativeQuery: native?.sample(),
              phase: "resolved",
              path: bounded ? path : null,
              result: path === null ? "no_path" : "path",
              gaps: bounded ? [] : ["production_spatial_path_overflow"]
            });
          },
          () => {
            if (!this.disposed) {
              this.append(owner, {
                ...captured(),
                nativeQuery: native?.sample(),
                phase: "rejected",
                path: null,
                result: null,
                gaps: []
              });
            }
            // Projection failure leaves an unmatched request; it cannot change the caller's Promise.
          }
        )
        .catch(() => undefined)
        .finally(() => this.navigationObservation?.release(native));
      return promise;
    };
    navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius = wrapper;
    this.restoreNavigation = () => {
      if (navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius === wrapper) {
        navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius = original;
      }
    };
  }

  private inspectHeightRoute(
    navigation: NavigationService,
    source: { readonly x: number; readonly y: number } | null,
    target: { readonly x: number; readonly y: number } | null
  ): Pick<
    Extract<AiRuntimeProductionSpatialV1, { kind: "builder_path" }>,
    "sourceNavigable" | "targetNavigable" | "heightGraphReachable"
  > {
    if (
      !source ||
      !target ||
      this.heightRouteInspections >= AiRuntimeProductionSpatialCapture.MAX_HEIGHT_ROUTE_INSPECTIONS
    )
      return { sourceNavigable: null, targetNavigable: null, heightGraphReachable: null };
    this.heightRouteInspections += 1;
    try {
      const graph = navigation.getHeightGraphDebugSnapshot();
      if (!graph) return { sourceNavigable: null, targetNavigable: null, heightGraphReachable: null };
      const sourceCell = graph.cells[source.y]?.[source.x];
      const targetCell = graph.cells[target.y]?.[target.x];
      if (!sourceCell?.isNavigable || !targetCell?.isNavigable)
        return {
          sourceNavigable: sourceCell?.isNavigable ?? false,
          targetNavigable: targetCell?.isNavigable ?? false,
          heightGraphReachable: false
        };
      const seen = new Set<string>([`${source.x},${source.y}`]);
      const pending = [{ x: source.x, y: source.y }];
      for (let cursor = 0; cursor < pending.length; cursor += 1) {
        const current = pending[cursor];
        if (!current) continue;
        if (current.x === target.x && current.y === target.y)
          return { sourceNavigable: true, targetNavigable: true, heightGraphReachable: true };
        for (const edge of graph.edgesByTileKey.get(`${current.x},${current.y}`) ?? []) {
          const key = `${edge.to.x},${edge.to.y}`;
          if (seen.has(key)) continue;
          seen.add(key);
          pending.push(edge.to);
        }
      }
      return { sourceNavigable: true, targetNavigable: true, heightGraphReachable: false };
    } catch {
      return { sourceNavigable: null, targetNavigable: null, heightGraphReachable: null };
    }
  }
}
