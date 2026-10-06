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
import { PRODUCTION_SPATIAL_AUTHORITY_EVENT, type ProductionSpatialAuthorityEvent } from
  "../../../world/services/multiplayer/production-spatial-authority-event";
import { captureAiRuntimeCreatedActor } from "./capture-ai-runtime-created-actor";
import { captureAiRuntimeProductionItem } from "./ai-runtime-production-item";
import type { AiRuntimeProductionSpatialV1 } from "./ai-runtime-production-spatial-v1";
import { captureAiRuntimeConstructionCatalog } from "./capture-ai-runtime-construction-catalog";

/** Test-owned service observation. Queries run once, return their original Promise and never feed an AI planner. */
export class AiRuntimeProductionSpatialCapture {
  private disposed = false;
  private nextQueryId = 1;
  private restoreNavigation?: () => void;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly identify: (actorId: string, item: UnifiedQueueItem) => string,
    private readonly append: (playerNumber: number, spatial: AiRuntimeProductionSpatialV1) => void
  ) {
    scene.events.on(PRODUCTION_SPATIAL_AUTHORITY_EVENT, this.observeNative, this);
    const navigation = getSceneService(scene, NavigationService);
    if (navigation) this.observeNavigation(navigation);
  }

  /** Restore only our installed method, preserving a later owner's replacement; pending callbacks are fenced. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.restoreNavigation?.();
    this.scene.events.off(PRODUCTION_SPATIAL_AUTHORITY_EVENT, this.observeNative, this);
  }

  private boundary() {
    return { clockTick: getSceneService(this.scene, SimulationTickService)?.currentTick ?? null,
      snapshotRestoreInProgress: isSnapshotApplyInProgress(this.scene), sceneActive: this.scene.sys?.isActive() ?? false };
  }

  private readonly observeNative = (event: ProductionSpatialAuthorityEvent): void => {
    if (this.disposed) return;
    if (event.kind === "placement") {
      if (event.site.scene !== this.scene) return;
      const footprint = event.footprint.length <= 128 ? event.footprint : null;
      const pricing = captureAiRuntimeConstructionCatalog(event);
      this.append(event.command.playerNumber, { ...this.boundary(), kind: "placement", command: event.command,
        site: captureAiRuntimeCreatedActor(event.site), footprint, legal: event.legal,
        catalog: pricing.catalog, gaps: [...pricing.gaps, ...(footprint ? [] : ["production_spatial_footprint_overflow"])] });
    } else {
      const producer = captureAiRuntimeCreatedActor(event.producer);
      if (event.producer.scene !== this.scene || producer.playerNumber === null || !producer.actorId) return;
      this.append(producer.playerNumber, { ...this.boundary(), kind: "spawn", producer,
        item: captureAiRuntimeProductionItem(producer.actorId, event.item, this.identify), waterUnit: event.waterUnit,
        tile: event.tile, position: event.position, gaps: [] });
    }
  };

  private observeNavigation(navigation: NavigationService): void {
    const original = navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius;
    const wrapper: typeof original = (...args) => {
      if (this.disposed) return original.apply(navigation, args);
      const [source, target, radius] = args;
      const playerNumber = getActorComponent(source, OwnerComponent)?.getOwner();
      if (source.scene !== this.scene || target.scene !== this.scene || playerNumber === undefined ||
        getActorComponent(target, OwnerComponent)?.getOwner() !== playerNumber ||
        !getActorComponent(source, BuilderComponent) || !getActorComponent(target, ConstructionSiteComponent)) {
        return original.apply(navigation, args);
      }
      const queryId = this.nextQueryId++;
      const snapshot = () => ({ ...this.boundary(), kind: "builder_path" as const, queryId,
        source: captureAiRuntimeCreatedActor(source), target: captureAiRuntimeCreatedActor(target),
        sourceTile: getGameObjectCurrentTile(source) ?? null, targetTile: getGameObjectCurrentTile(target) ?? null,
        radiusTiles: radius ?? null });
      this.append(playerNumber, { ...snapshot(), phase: "requested", path: null, result: null, gaps: [] });
      let promise: ReturnType<typeof original>;
      try { promise = original.apply(navigation, args); }
      catch (error) {
        this.append(playerNumber, { ...snapshot(), phase: "threw", path: null, result: null, gaps: [] });
        throw error;
      }
      // Subscribe before the caller awaits, retaining the exact Promise, result object and native rejection.
      void promise.then((path) => {
        if (this.disposed) return;
        const bounded = path === null || path.length <= 512;
        this.append(playerNumber, { ...snapshot(), phase: "resolved", path: bounded ? path : null,
          result: path === null ? "no_path" : "path", gaps: bounded ? [] : ["production_spatial_path_overflow"] });
      }, () => {
        if (!this.disposed) {
          this.append(playerNumber, { ...snapshot(), phase: "rejected", path: null, result: null, gaps: [] });
        }
      }).catch(() => undefined); // Projection failure leaves an unmatched request; it cannot change the caller's Promise.
      return promise;
    };
    navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius = wrapper;
    this.restoreNavigation = () => {
      if (navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius === wrapper) {
        navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius = original;
      }
    };
  }
}
