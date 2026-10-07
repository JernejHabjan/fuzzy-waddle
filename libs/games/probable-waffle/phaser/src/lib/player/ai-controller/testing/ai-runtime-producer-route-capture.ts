import type Phaser from "phaser";
import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { getActorComponent } from "../../../data/actor-component";
import { getGameObjectCurrentTile } from "../../../data/game-object-helper";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { ProductionComponent } from "../../../entity/components/production/production-component";
import type { NavigationService } from "../../../world/services/navigation.service";
import type { ProductionSpatialAuthorityEvent } from "../../../world/services/multiplayer/production-spatial-authority-event";
import { captureAiRuntimeCreatedActor } from "./capture-ai-runtime-created-actor";
import { captureAiRuntimeProductionItem } from "./ai-runtime-production-item";
import type { AiRuntimeProductionSpatialV1 } from "./ai-runtime-production-spatial-v1";
import type { AiRuntimeNavigationObservation } from "./ai-runtime-navigation-observation";
import type { AiRuntimeProducerRouteV1 } from "./ai-runtime-producer-route-v1";

/** Passive instance wrappers and actual returned-object bindings, owned only by the marked test capture. */
export class AiRuntimeProducerRouteCapture {
  private disposed = false;
  /** Capture-local counters saturate; neither is a native command or navigation revision. */
  private nextQueryId = 1;
  private nextOutputId = 1;
  /** Weak object identity prevents same-ID replacement actors from inheriting output ownership. */
  private products = new WeakMap<Phaser.GameObjects.GameObject, { outputId: number; playerNumber: number }>();
  private readonly restores: (() => void)[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly boundary: () => Pick<AiRuntimeProductionSpatialV1,
      "clockTick" | "snapshotRestoreInProgress" | "sceneActive">,
    private readonly identify: (actorId: string, item: UnifiedQueueItem) => string,
    private readonly append: (playerNumber: number, value: AiRuntimeProductionSpatialV1) => void,
    private readonly navigationObservation?: AiRuntimeNavigationObservation
  ) {}

  /** Bind the actual returned object before rally starts. At most 256 outputs acquire future-query bindings. */
  observeOutput(event: Extract<ProductionSpatialAuthorityEvent, { kind: "output" }>): void {
    if (this.disposed || event.producer.scene !== this.scene || event.product.scene !== this.scene) return;
    try {
      const producer = captureAiRuntimeCreatedActor(event.producer);
      if (producer.playerNumber === null || !producer.actorId || this.nextOutputId > 8192) return;
      const outputId = this.nextOutputId++;
      const gaps = outputId > 256 ? ["production_route_output_binding_overflow"] : [];
      if (!gaps.length) this.products.set(event.product, { outputId, playerNumber: producer.playerNumber });
      this.emit(producer.playerNumber, { ...this.boundary(), kind: "output", outputId, producer,
        product: captureAiRuntimeCreatedActor(event.product),
        item: captureAiRuntimeProductionItem(producer.actorId, event.item, this.identify),
        rallyMode: event.rallyMode, target: event.target ? captureAiRuntimeCreatedActor(event.target) : null,
        targetTile: event.targetTile, gaps });
    } catch { /* Unobserved output remains missing; a later object/name match cannot repair it. */ }
  }

  /** Wrap existing native calls only. Static, dynamic and object-radius queries keep their exact receiver/arguments/Promise. */
  install(navigation: NavigationService): void {
    const objectOriginal = navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius;
    const objectWrapper: typeof objectOriginal = (...args) => this.observe(args[0], args[1], null, args[2] ?? null,
      "object_radius", null, () => objectOriginal.apply(navigation, args));
    navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius = objectWrapper;
    this.restores.push(() => {
      if (navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius === objectWrapper) {
        navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius = objectOriginal;
      }
    });
    const tileOriginal = navigation.findPathFromGameObjectToTile;
    if (typeof tileOriginal === "function") {
      const tileWrapper: typeof tileOriginal = (...args) => this.observe(args[0], null, args[1], null,
        "tile_static", null, () => tileOriginal.apply(navigation, args));
      navigation.findPathFromGameObjectToTile = tileWrapper;
      this.restores.push(() => {
        if (navigation.findPathFromGameObjectToTile === tileWrapper) navigation.findPathFromGameObjectToTile = tileOriginal;
      });
    }
    const dynamicOriginal = navigation.findPathFromGameObjectToTileAvoidingDynamicBlockers;
    if (typeof dynamicOriginal === "function") {
      const dynamicWrapper: typeof dynamicOriginal = (...args) => this.observe(args[0], null, args[1], null,
        "tile_dynamic", args[2].length, () => dynamicOriginal.apply(navigation, args));
      navigation.findPathFromGameObjectToTileAvoidingDynamicBlockers = dynamicWrapper;
      this.restores.push(() => {
        if (navigation.findPathFromGameObjectToTileAvoidingDynamicBlockers === dynamicWrapper) {
          navigation.findPathFromGameObjectToTileAvoidingDynamicBlockers = dynamicOriginal;
        }
      });
    }
  }

  /** Reverse wrapper order, fence late callbacks, and release every capture-owned product binding. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.restores.reverse().forEach((restore) => restore());
    this.restores.length = 0;
    this.products = new WeakMap();
  }

  private emit(playerNumber: number, value: AiRuntimeProductionSpatialV1): void {
    try { this.append(playerNumber, structuredClone(value)); }
    catch { /* A lost diagnostic cannot change the native Promise or invoke another query. */ }
  }

  /** Diagnostic reads are fenced separately from the one native invocation, including synchronous throws. */
  private observe(
    source: Phaser.GameObjects.GameObject, target: Phaser.GameObjects.GameObject | null,
    targetTile: Vector2Simple | null, radiusTiles: number | null,
    method: Extract<AiRuntimeProducerRouteV1, { kind: "producer_path" }>["method"], dynamicBlockerCount: number | null,
    call: () => Promise<Vector2Simple[] | null>
  ): Promise<Vector2Simple[] | null> {
    if (this.disposed || this.nextQueryId > 8192) return call();
    let snapshot: (() => AiRuntimeProductionSpatialV1 & { kind: "producer_path" }) | undefined;
    let playerNumber: number | undefined;
    try {
      playerNumber = getActorComponent(source, OwnerComponent)?.getOwner();
      const output = this.products.get(source);
      const ownedOutput = output?.playerNumber === playerNumber ? output : undefined;
      const service = target?.scene === this.scene && !!getActorComponent(target, ProductionComponent) &&
        getActorComponent(target, OwnerComponent)?.getOwner() === playerNumber;
      if (source.scene === this.scene && playerNumber !== undefined && (ownedOutput || service)) {
        // Copy mutable caller tile before awaiting. Target actor position is independently sampled at each boundary.
        const requestedTile = targetTile ? { ...targetTile } : null;
        const queryId = this.nextQueryId++;
        snapshot = () => ({ ...this.boundary(), kind: "producer_path", queryId,
          purpose: ownedOutput ? "product_output" : "producer_service", outputId: ownedOutput?.outputId ?? null,
          method, dynamicBlockerCount, radiusTiles, navigation: this.navigationObservation?.sample(),
          sourceInCaptureScene: source.scene === this.scene, targetInCaptureScene: target ? target.scene === this.scene : null,
          source: captureAiRuntimeCreatedActor(source), target: target ? captureAiRuntimeCreatedActor(target) : null,
          sourceTile: getGameObjectCurrentTile(source) ?? null,
          targetTile: target ? getGameObjectCurrentTile(target) ?? null : requestedTile,
          phase: "requested", path: null, result: null, gaps: [] });
        this.emit(playerNumber, snapshot());
      }
    } catch { snapshot = undefined; }
    const native = snapshot ? this.navigationObservation?.query() : undefined;
    let promise: Promise<Vector2Simple[] | null>;
    try { promise = native ? native.invoke(call) : call(); }
    catch (error) {
      if (snapshot && playerNumber !== undefined) {
        try { this.emit(playerNumber, { ...snapshot(), nativeQuery: native?.sample(), phase: "threw" }); }
        catch { /* Preserve native error. */ }
      }
      this.navigationObservation?.release(native);
      throw error;
    }
    const captured = snapshot;
    const owner = playerNumber;
    if (captured && owner !== undefined) {
      void promise.then((path) => {
        if (this.disposed) return;
        const bounded = path === null || path.length <= 512;
        this.emit(owner, { ...captured(), nativeQuery: native?.sample(), phase: "resolved", result: path === null ? "no_path" : "path",
          path: bounded ? path : null, gaps: bounded ? [] : ["production_route_path_overflow"] });
      }, () => {
        if (!this.disposed) this.emit(owner, { ...captured(), nativeQuery: native?.sample(), phase: "rejected" });
      }).catch(() => undefined).finally(() => this.navigationObservation?.release(native));
    }
    return promise;
  }
}
