import type { ProbableWaffleLightingAmbientKeyframe } from "@fuzzy-waddle/api-interfaces";
import { Subscription } from "rxjs";
import { GameSettings } from "../../../core/gameSettings";
import { getActorComponent } from "../../../data/actor-component";
import { getGameObjectBoundsRaw, getGameObjectDepth } from "../../../data/game-object-helper";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { ActorTranslateComponent } from "../../../entity/components/movement/actor-translate-component";
import { OptionsService } from "../../../../gui/options/options.service";
import type GameProbableWaffleScene from "../../scenes/GameProbableWaffleScene";
import { getSceneExternalComponent } from "../scene-component-helpers";
import {
  markGameObjectIgnoreSceneLighting,
  shouldCastSceneShadow,
  shouldIgnoreSceneLighting,
  shouldRespondToSceneAmbient
} from "./lighting-game-object-meta";
import {
  resolveSceneLightingConfig
} from "./scene-lighting.config";
import type { ResolvedSceneLightingConfig } from "./resolved-scene-lighting.config";

/**
 * Temporary branch-level kill switch for dropped shadows.
 * Keep this `false` until the shadow implementation is ready to ship again.
 *
 * Note that actor shadows are now disabled.
 * "selfShadow" in phaser 4 is not actual "cast-shadow on terrain".
 * In the code, the ellipse shadows can be enabled, but currently they look quite bad.
 * Duplicating actor sprite and converting it into shadow may not work as desired as some game objects have multiple sprites. Shadows may be too detailed and may not look good.
 *
 * The best option would be to create a custom hand-drawn sprite and attach it to an actor and then transform and stretch that sprite as the light source moves.
 * Currently, this is of very low priority.
 */
const DROP_SHADOWS_RUNTIME_ENABLED = false;

/** Describes how a tracked render target participates in camera-based effect culling. */
type VisibilityCullMode = "always" | "expandedVisibilityCamera" | "expandedShadowCamera";

type LightingAwareGameObject = Phaser.GameObjects.GameObject & {
  setLighting?: (enable: boolean) => Phaser.GameObjects.GameObject;
  setSelfShadow?: (
    enabled?: boolean | undefined,
    penumbra?: number,
    diffuseFlatThreshold?: number
  ) => Phaser.GameObjects.GameObject;
  visible?: boolean;
  active?: boolean;
};

type ShadowCasterGameObject = Phaser.GameObjects.GameObject & {
  visible?: boolean;
  active?: boolean;
};

type AmbientResponsiveGameObject = Phaser.GameObjects.GameObject & {
  setAlpha?: (alpha?: number) => Phaser.GameObjects.GameObject;
  alpha?: number;
  visible?: boolean;
  active?: boolean;
};

type TrackedObject = {
  gameObject: Phaser.GameObjects.GameObject;
  lightingTarget?: LightingAwareGameObject;
  ambientTarget?: AmbientResponsiveGameObject;
  shadowCaster?: ShadowCasterGameObject;
  shadowVisual?: Phaser.GameObjects.Ellipse;
  actorMovedSubscription?: Subscription;
  lightingEnabled: boolean;
  ambientAlpha: number;
  shadowEnabled: boolean;
  /**
   * Dirty shadows bypass the throttled reprojection interval once so movement- and camera-driven
   * changes land immediately, then fall back to the cheaper periodic updates.
   */
  shadowDirty: boolean;
  onDestroy: () => void;
  onKilled: () => void;
};

type AnimatedLightUpdater = (time: number, delta: number) => void;

export type SceneDayNightClockState = {
  enabled: boolean;
  normalizedTime: number;
  displayText: string;
};

type SceneLightFootprint = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
};

/**
 * Centralized Phaser 4 lighting coordinator for the Probable Waffle scene.
 *
 * Responsibilities:
 * - enable / disable Phaser lighting on eligible world objects
 * - manage the map ambient color and day-night cycle
 * - maintain lightweight dropped shadows for registered casters
 * - dim ambient-only overlays such as health and owner bars at night
 * - react live to the user-facing lighting setting
 */
export class SceneLightingService {
  private static readonly IsoTopLayerAllowance = 8;
  private static readonly KeyLightTravelMarginRatio = 0.18;
  /**
   * Positions sunrise / sunset around the vertical middle band of the isometric footprint so the
   * light sweep reads across the body of the map instead of hugging the elevated top allowance.
   */
  private static readonly KeyLightHorizonRatio = 0.52;
  /**
   * Keeps the noon apex above the map midpoint without pushing the light path unrealistically far
   * into the top-only area of the scene.
   */
  private static readonly KeyLightVerticalArcRatio = 0.28;
  private static readonly KeyLightRadiusMinScale = 1.2;
  private static readonly KeyLightRadiusMaxScale = 1.7;
  private static readonly KeyLightIntensityMinScale = 0.02;
  private static readonly KeyLightIntensityMaxScale = 0.72;
  private readonly config: ResolvedSceneLightingConfig;
  private readonly trackedObjects = new Map<Phaser.GameObjects.GameObject, TrackedObject>();
  private readonly animatedLightUpdaters = new Set<AnimatedLightUpdater>();
  /** Cached world-space bounds for container subtrees to avoid repeated recursive aggregation. */
  private readonly renderBoundsCache = new WeakMap<Phaser.GameObjects.GameObject, Phaser.Geom.Rectangle | null>();
  /** Dirty roots whose cached container bounds must be recomputed before the next cull query. */
  private readonly dirtyRenderBounds = new WeakSet<Phaser.GameObjects.GameObject>();

  private keyLight?: Phaser.GameObjects.Light;
  private ambientColor = 0xffffff;
  private cycleTime = 0;
  private cycleElapsedMs = 0;
  private effectsEnabled = false;
  private visibilityRefreshAccumulator = 0;
  private readonly visibilityRefreshIntervalMs = 100;
  /** Cached so camera-driven lighting and ambient culling can refresh immediately between interval ticks. */
  private lastVisibilityCameraState?: { scrollX: number; scrollY: number; zoom: number };
  /** Stable shadows are reprojected at this cadence to keep the moving sun/moon affordable. */
  private shadowUpdateAccumulator = 0;
  private readonly shadowUpdateIntervalMs = 100;
  /** Cached so the service can react immediately to camera movement without a separate event bus. */
  private lastCameraState?: { scrollX: number; scrollY: number; zoom: number };
  private optionsChangedSubscription?: Subscription;

  constructor(private readonly scene: GameProbableWaffleScene) {
    const approximateRadius = Math.max(
      600,
      Math.floor(Math.max(scene.tilemap.widthInPixels, scene.tilemap.heightInPixels) * 0.8)
    );
    this.config = resolveSceneLightingConfig(scene.mapInfo.lighting, approximateRadius);
    if (!this.config.enabled) return;

    this.scene.lights.enable();
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.scene.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, this.onAddedToScene, this);
    this.scene.events.on(Phaser.Scenes.Events.REMOVED_FROM_SCENE, this.onRemovedFromScene, this);
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);

    this.setupLighting();
    if (this.effectsEnabled) {
      this.registerExistingSceneObjects();
    }
    this.subscribeToOptions();
  }

  /**
   * Re-scan a prefab root after it swaps internal renderable children.
   * This is used by dynamic containers like walls and stairs.
   */
  syncGameObjectTree(gameObject: Phaser.GameObjects.GameObject): void {
    this.invalidateRenderableBounds(gameObject);
    this.markShadowDirtyForTree(gameObject);
    if (!this.config.enabled || !this.effectsEnabled || shouldIgnoreSceneLighting(gameObject)) return;
    if (this.isContainer(gameObject)) {
      gameObject.list.forEach((child) => this.syncGameObjectTree(child));
    }

    this.registerGameObject(gameObject);
    const tracked = this.trackedObjects.get(gameObject);
    if (tracked) {
      this.refreshTrackedObject(tracked);
    }
  }

  /**
   * Registers one scene object with the lighting service.
   * Registration is intentionally centralized so actor code does not need to
   * contain scattered `setLighting(true)` calls.
   */
  registerGameObject(gameObject: Phaser.GameObjects.GameObject): void {
    if (
      !this.config.enabled ||
      !this.effectsEnabled ||
      !gameObject ||
      this.trackedObjects.has(gameObject) ||
      shouldIgnoreSceneLighting(gameObject)
    ) {
      return;
    }

    if (this.isContainer(gameObject)) {
      gameObject.list.forEach((child) => this.registerGameObject(child));
    }

    this.invalidateRenderableBounds(gameObject);

    const tracked: TrackedObject = {
      gameObject,
      lightingTarget: this.asLightingTarget(gameObject),
      ambientTarget: this.asAmbientTarget(gameObject),
      shadowCaster: this.asShadowCaster(gameObject),
      actorMovedSubscription: this.areDropShadowsEnabled()
        ? this.subscribeToActorMovement(gameObject)
        : undefined,
      lightingEnabled: false,
      ambientAlpha: 1,
      shadowEnabled: false,
      shadowDirty: this.areDropShadowsEnabled(),
      onDestroy: () => this.unregisterGameObject(gameObject),
      onKilled: () => this.unregisterGameObject(gameObject)
    };

    if (!tracked.lightingTarget && !tracked.ambientTarget && !tracked.shadowCaster) return;

    this.trackedObjects.set(gameObject, tracked);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, tracked.onDestroy);
    gameObject.once(HealthComponent.KilledEvent, tracked.onKilled);
    this.refreshTrackedObject(tracked);
  }

  unregisterGameObject(gameObject: Phaser.GameObjects.GameObject): void {
    const tracked = this.trackedObjects.get(gameObject);
    if (!tracked) return;
    this.invalidateRenderableBounds(gameObject);
    this.applyLighting(tracked, false);
    this.applyAmbient(tracked, false);
    this.applyShadow(tracked, false);
    tracked.shadowVisual?.destroy();
    tracked.shadowVisual = undefined;
    tracked.actorMovedSubscription?.unsubscribe();
    tracked.gameObject.off(Phaser.GameObjects.Events.DESTROY, tracked.onDestroy);
    tracked.gameObject.off(HealthComponent.KilledEvent, tracked.onKilled);
    this.trackedObjects.delete(gameObject);
  }

  addAnimatedLightUpdater(updater: AnimatedLightUpdater): () => void {
    this.animatedLightUpdaters.add(updater);
    return () => this.animatedLightUpdaters.delete(updater);
  }

  /**
   * Exposes a HUD-friendly day/night clock snapshot without leaking lighting internals.
   */
  getDayNightClockState(): SceneDayNightClockState {
    const normalizedTime = Phaser.Math.Wrap(this.cycleTime, 0, 1);
    return {
      enabled: this.config.enabled && this.config.dayNightCycle.enabled && this.effectsEnabled,
      normalizedTime,
      displayText: this.formatClockText(normalizedTime)
    };
  }

  /**
   * Registers a late-created runtime object after its lighting metadata has been assigned.
   * Ambient-only UI graphics use this because `scene.add.graphics()` adds them to the scene
   * before they can be marked as ambient responsive.
   */
  registerDynamicGameObject(gameObject: Phaser.GameObjects.GameObject): void {
    this.registerGameObject(gameObject);
  }

  addLight(
    x: number,
    y: number,
    radius: number,
    color: number = 0xffffff,
    intensity: number = 1,
    z?: number
  ): Phaser.GameObjects.Light {
    return this.scene.lights.addLight(x, y, radius, color, intensity, z);
  }

  private onAddedToScene(gameObject: Phaser.GameObjects.GameObject): void {
    if (!this.effectsEnabled) return;
    this.registerGameObject(gameObject);
  }

  private onRemovedFromScene(gameObject: Phaser.GameObjects.GameObject): void {
    this.unregisterGameObject(gameObject);
  }

  private registerExistingSceneObjects(): void {
    this.scene.children.list.forEach((child) => this.registerGameObject(child));
  }

  /**
   * Reads the persisted user setting and sets up the scene-level ambient/key light state.
   */
  private setupLighting(): void {
    this.effectsEnabled = GameSettings.loadFromLocalStorage().enableSceneLightingEffects;
    this.cycleElapsedMs = this.getInitialCycleElapsedMs();
    this.cycleTime = this.getCycleTimeFromElapsedMs(this.cycleElapsedMs);
    this.ambientColor = this.effectsEnabled ? this.getConfiguredAmbientColor() : 0xffffff;
    this.scene.lights.setAmbientColor(this.ambientColor);

    if (this.config.keyLight.enabled) {
      const footprint = this.getSceneLightFootprint();
      this.keyLight = this.scene.lights.addLight(
        footprint.centerX,
        footprint.centerY,
        this.config.keyLight.radius,
        this.config.keyLight.color,
        this.config.keyLight.intensity,
        this.config.keyLight.z
      );
      this.updateKeyLight(this.cycleTime);
      this.keyLight.setVisible(this.effectsEnabled);
    }
  }

  private update(_time: number, delta: number): void {
    if (!this.effectsEnabled) {
      return;
    }

    if (this.didVisibilityCameraStateChange()) {
      this.visibilityRefreshAccumulator = this.visibilityRefreshIntervalMs;
    }

    if (this.config.dayNightCycle.enabled) {
      this.advanceCycle(delta);
      const nextAmbient = this.calculateAmbientColor(this.cycleTime);
      if (nextAmbient !== this.ambientColor) {
        this.ambientColor = nextAmbient;
        this.scene.lights.setAmbientColor(nextAmbient);
      }
      this.updateKeyLight(this.cycleTime);
    }

    this.visibilityRefreshAccumulator += delta;
    if (this.visibilityRefreshAccumulator >= this.visibilityRefreshIntervalMs) {
      this.visibilityRefreshAccumulator = 0;
      this.trackedObjects.forEach((tracked) => this.refreshTrackedObject(tracked));
    }

    if (this.areDropShadowsEnabled()) {
      // Camera motion should immediately invalidate nearby shadows even though steady-state
      // reprojection remains throttled for performance.
      if (this.didCameraStateChange()) {
        this.visibilityRefreshAccumulator = this.visibilityRefreshIntervalMs;
        this.shadowUpdateAccumulator = this.shadowUpdateIntervalMs;
        this.markVisibleShadowCastersDirty();
      }

      // Dirty casters bypass the interval once, then the regular throttled pass takes over again.
      this.flushDirtyShadows();
      this.shadowUpdateAccumulator += delta;
      if (this.shadowUpdateAccumulator >= this.shadowUpdateIntervalMs) {
        this.shadowUpdateAccumulator = 0;
        this.trackedObjects.forEach((tracked) => {
          if (this.shouldUpdateShadow(tracked)) {
            this.updateShadowTransform(tracked);
          }
        });
      }
    }

    this.animatedLightUpdaters.forEach((updater) => updater(_time, delta));
  }

  /**
   * Moves the key light across the map width so the sun / moon direction reads as a sweep,
   * rather than a small orbit near the map center.
   */
  private updateKeyLight(cycleTime: number): void {
    if (!this.keyLight) return;
    const state = this.getKeyLightState(cycleTime);
    this.keyLight.x = state.x;
    this.keyLight.y = state.y;
    this.keyLight.radius = state.radius;
    this.keyLight.intensity = state.intensity;
  }

  /**
   * Computes the moving key-light state for the current cycle position.
   * The light path is derived from the isometric map footprint so it sweeps across the same
   * world-space span as the actual map instead of assuming a simple 0..width coordinate system.
   */
  private getKeyLightState(cycleTime: number): { x: number; y: number; radius: number; intensity: number } {
    const footprint = this.getSceneLightFootprint();
    const travelMargin = footprint.width * SceneLightingService.KeyLightTravelMarginRatio;
    const verticalTravel = footprint.height * SceneLightingService.KeyLightVerticalArcRatio;
    const horizonY = footprint.top + footprint.height * SceneLightingService.KeyLightHorizonRatio;
    const { sunriseTime, sunsetTime } = this.getSunWindow();
    const daylightProgress = this.getNormalizedWindowProgress(cycleTime, sunriseTime, sunsetTime);
    const daylightArc = Math.sin(daylightProgress * Math.PI);
    const solarPresence = easeInOut(daylightArc);
    const horizontalProgress = easeInOut(daylightProgress);
    const radius = this.config.keyLight.radius * lerpNumber(
      SceneLightingService.KeyLightRadiusMinScale,
      SceneLightingService.KeyLightRadiusMaxScale,
      solarPresence
    );
    const intensity = this.config.keyLight.intensity * lerpNumber(
      SceneLightingService.KeyLightIntensityMinScale,
      SceneLightingService.KeyLightIntensityMaxScale,
      solarPresence
    );
    const x = cycleTime <= sunriseTime
      ? footprint.left - travelMargin
      : cycleTime >= sunsetTime
        ? footprint.right + travelMargin
        : lerpNumber(footprint.left - travelMargin, footprint.right + travelMargin, horizontalProgress);
    const y = horizonY - daylightArc * verticalTravel;

    return {
      x,
      y,
      radius,
      intensity
    };
  }

  /**
   * Derives a stable sunrise/sunset window from the ambient keyframes so the key light sweep
   * follows the same notion of "day" as the map tinting.
   */
  private getSunWindow(): { sunriseTime: number; sunsetTime: number } {
    const keyframes = this.config.dayNightCycle.keyframes;
    if (keyframes.length < 2) {
      return { sunriseTime: 0.2, sunsetTime: 0.8 };
    }

    const firstDaylightKeyframe = keyframes.find((keyframe) => keyframe.time > 0 && keyframe.time < 0.5);
    const lastDaylightKeyframe = [...keyframes].reverse().find((keyframe) => keyframe.time > 0.5 && keyframe.time < 1);

    const sunriseTime = firstDaylightKeyframe?.time ?? 0.2;
    const sunsetTime = lastDaylightKeyframe?.time ?? 0.8;

    if (sunsetTime <= sunriseTime) {
      return { sunriseTime: 0.2, sunsetTime: 0.8 };
    }

    return { sunriseTime, sunsetTime };
  }

  /**
   * Returns the world-space footprint for lighting using the same core isometric assumptions as
   * the camera bounds: centered X, elevated top allowance for stacked layers, and bottom aligned
   * to the tilemap pixel height.
   */
  private getSceneLightFootprint(): SceneLightFootprint {
    const width = this.scene.tilemap.widthInPixels;
    const height = this.scene.tilemap.heightInPixels;
    const topAllowance = this.scene.tilemap.tileHeight * SceneLightingService.IsoTopLayerAllowance;
    const left = -width / 2;
    const right = width / 2;
    const top = -topAllowance;
    const bottom = height;

    return {
      left,
      right,
      top,
      bottom,
      width: right - left,
      height: bottom - top,
      centerX: (left + right) / 2,
      centerY: (top + bottom) / 2
    };
  }

  /**
   * Maps a cycle position into 0..1 inside a configured window and clamps outside it.
   */
  private getNormalizedWindowProgress(time: number, start: number, end: number): number {
    if (end <= start) return 0;
    const clamped = Phaser.Math.Clamp(time, start, end);
    return (clamped - start) / (end - start);
  }

  /**
   * Converts the map-configured start offset into runtime elapsed milliseconds.
   */
  private getInitialCycleElapsedMs(): number {
    const duration = Math.max(1, this.config.dayNightCycle.durationMs);
    return this.config.dayNightCycle.startTimeNormalized * duration;
  }

  /**
   * Advances the lighting clock using the same scaled delta as the rest of the simulation.
   * This makes the day-night cycle respect the in-game time multiplier.
   */
  private advanceCycle(delta: number): void {
    const duration = Math.max(1, this.config.dayNightCycle.durationMs);
    const scaledDelta = delta * this.scene.time.timeScale;
    this.cycleElapsedMs = (this.cycleElapsedMs + scaledDelta) % duration;
    this.cycleTime = this.getCycleTimeFromElapsedMs(this.cycleElapsedMs);
  }

  private getCycleTimeFromElapsedMs(elapsedMs: number): number {
    const duration = Math.max(1, this.config.dayNightCycle.durationMs);
    return elapsedMs / duration;
  }

  /**
   * Converts the normalized cycle position into a stable 24-hour HUD clock.
   * `0` maps to midnight, `0.25` to 06:00, `0.5` to 12:00, and so on.
   */
  private formatClockText(normalizedTime: number): string {
    const totalMinutes = Math.floor(Phaser.Math.Wrap(normalizedTime, 0, 1) * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  private calculateAmbientColor(cycleTime: number): number {
    const keyframes = this.config.dayNightCycle.keyframes;
    if (keyframes.length === 0) return this.config.ambientColor;
    if (keyframes.length === 1) return keyframes[0]!.ambientColor;

    const segment = this.getSurroundingKeyframes(keyframes, cycleTime);
    if (!segment) return this.config.ambientColor;
    const { before, after } = segment;
    const range = after.time - before.time;
    if (range <= 0) return after.ambientColor;
    const localT = (cycleTime - before.time) / range;
    return lerpColor(before.ambientColor, after.ambientColor, localT);
  }

  private getSurroundingKeyframes(
    keyframes: ProbableWaffleLightingAmbientKeyframe[],
    cycleTime: number
  ): { before: ProbableWaffleLightingAmbientKeyframe; after: ProbableWaffleLightingAmbientKeyframe } | null {
    for (let i = 1; i < keyframes.length; i++) {
      const before = keyframes[i - 1];
      const after = keyframes[i];
      if (!before || !after) continue;
      if (cycleTime >= before.time && cycleTime <= after.time) {
        return { before, after };
      }
    }
    return null;
  }

  private refreshTrackedObject(tracked: TrackedObject): void {
    const shouldRenderLighting = this.effectsEnabled && this.shouldRenderLighting(tracked);
    const shouldRenderAmbient = this.effectsEnabled && this.shouldRenderAmbient(tracked);
    const shouldRenderShadow = this.effectsEnabled && this.shouldRenderShadow(tracked);
    this.applyLighting(tracked, shouldRenderLighting);
    this.applyAmbient(tracked, shouldRenderAmbient);
    this.applyShadow(tracked, shouldRenderShadow);
  }

  /**
   * Phaser lighting culling is split by render role rather than object type checks scattered
   * across the service. Tilemap layers stay lit for the full scene because their world-space
   * bounds do not map cleanly to the camera when the isometric map extends into negative X.
   */
  private shouldRenderLighting(tracked: TrackedObject): boolean {
    const target = tracked.lightingTarget;
    if (!target) return false;
    if (tracked.gameObject.scene !== this.scene) return false;
    if ((target.active ?? true) === false || (target.visible ?? true) === false) return false;
    return this.isGameObjectInCullRange(tracked.gameObject, this.getLightingCullMode(tracked.gameObject));
  }

  /**
   * Shadows are updated at a lower cadence than the rest of the lighting system.
   * This keeps shadow motion responsive enough while avoiding per-frame transform churn.
   */
  private shouldUpdateShadow(tracked: TrackedObject): boolean {
    if (!tracked.shadowEnabled || !tracked.shadowCaster || !tracked.shadowVisual) return false;
    if ((tracked.shadowCaster.active ?? true) === false || (tracked.shadowCaster.visible ?? true) === false) return false;
    if (tracked.shadowDirty) return true;
    return this.isGameObjectInCullRange(tracked.shadowCaster, "expandedShadowCamera");
  }

  /**
   * Shadows stay active in a larger area around the camera so quick camera pans do not
   * repeatedly pop nearby shadows in and out.
   */
  private shouldRenderShadow(tracked: TrackedObject): boolean {
    if (!tracked.shadowCaster) return false;
    if (tracked.gameObject.scene !== this.scene) return false;
    if ((tracked.shadowCaster.active ?? true) === false || (tracked.shadowCaster.visible ?? true) === false) return false;
    return this.isGameObjectInCullRange(tracked.shadowCaster, "expandedShadowCamera");
  }

  /**
   * Ambient-only overlays such as health bars and owner bars should still dim at night,
   * even if they are not normal lit renderables and do not expose stable bounds.
   */
  private shouldRenderAmbient(tracked: TrackedObject): boolean {
    const target = tracked.ambientTarget;
    if (!target) return false;
    if (tracked.gameObject.scene !== this.scene) return false;
    if ((target.active ?? true) === false || (target.visible ?? true) === false) return false;

    const rootMode = this.getAmbientCullMode(tracked.gameObject);
    if (this.isGameObjectInCullRange(tracked.gameObject, rootMode)) return true;

    const targetMode = this.getAmbientCullMode(target);
    return this.isGameObjectInCullRange(target, targetMode, true);
  }

  /**
   * World layers such as tilemaps should stay lit even when the camera moves beyond their raw
   * bounds, while ordinary world actors still use the camera rect to avoid unnecessary pipeline work.
   */
  private getLightingCullMode(gameObject: Phaser.GameObjects.GameObject): VisibilityCullMode {
    if (gameObject instanceof Phaser.Tilemaps.TilemapLayer) {
      return "always";
    }
    return "expandedVisibilityCamera";
  }

  /**
   * Ambient-only overlays can fall back to always-on behavior when they do not expose stable bounds.
   * This keeps health bars and owner strips darkening even though Phaser Graphics are lightweight UI helpers.
   */
  private getAmbientCullMode(gameObject: Phaser.GameObjects.GameObject): VisibilityCullMode {
    if (gameObject instanceof Phaser.Tilemaps.TilemapLayer) {
      return "always";
    }
    return "expandedVisibilityCamera";
  }

  /**
   * Centralized cull helper shared by lighting, ambient overlays, and shadows.
   * `allowMissingBounds` is only used for ambient-only helper graphics that should keep responding
   * to the cycle even when Phaser cannot provide a stable world-space rectangle for them.
   */
  private isGameObjectInCullRange(
    gameObject: Phaser.GameObjects.GameObject,
    mode: VisibilityCullMode,
    allowMissingBounds: boolean = false
  ): boolean {
    if (mode === "always") return true;

    const bounds = this.getRenderableBounds(gameObject);
    if (!bounds) return allowMissingBounds;

    const cullBounds = mode === "expandedShadowCamera"
      ? this.getExpandedShadowCullBounds()
      : this.getExpandedVisibilityCullBounds();
    return Phaser.Geom.Rectangle.Overlaps(cullBounds, bounds);
  }

  /**
   * Lighting and ambient dimming stay active in a wider area around the viewport so camera pans do
   * not reveal nearby objects that have not yet been updated to the current day-night state.
   */
  private getExpandedVisibilityCullBounds(): Phaser.Geom.Rectangle {
    const worldView = this.scene.cameras.main.worldView;
    return new Phaser.Geom.Rectangle(
      worldView.x - worldView.width * 3,
      worldView.y - worldView.height * 3,
      worldView.width * 7,
      worldView.height * 7
    );
  }

  private applyLighting(tracked: TrackedObject, enabled: boolean): void {
    if (!tracked.lightingTarget) return;
    if (tracked.lightingEnabled === enabled) return;
    tracked.lightingTarget.setLighting?.(enabled);
    if (enabled && tracked.lightingTarget.setSelfShadow) {
      tracked.lightingTarget.setSelfShadow(
        this.config.selfShadow.enabled ?? undefined,
        this.config.selfShadow.penumbra,
        this.config.selfShadow.diffuseFlatThreshold
      );
    }
    tracked.lightingEnabled = enabled;
  }

  private applyAmbient(tracked: TrackedObject, enabled: boolean): void {
    if (!tracked.ambientTarget || typeof tracked.ambientTarget.setAlpha !== "function") return;
    const nextAlpha = enabled ? this.getAmbientOverlayAlpha() : 1;
    if (Math.abs(tracked.ambientAlpha - nextAlpha) < 0.01) return;
    tracked.ambientTarget.setAlpha(nextAlpha);
    tracked.ambientAlpha = nextAlpha;
  }

  private applyShadow(tracked: TrackedObject, enabled: boolean): void {
    if (!this.areDropShadowsEnabled() || !tracked.shadowCaster) return;
    const shadowVisual = this.ensureShadowVisual(tracked);
    if (!shadowVisual) return;

    if (!enabled) {
      shadowVisual.setVisible(false);
      tracked.shadowEnabled = false;
      tracked.shadowDirty = false;
      return;
    }

    tracked.shadowEnabled = true;
    shadowVisual.setVisible(true);
    this.updateShadowTransform(tracked);
  }

  /**
   * Lazily creates a single soft shadow visual per caster.
   * The shadow object is marked to fully ignore lighting so it never re-registers itself.
   */
  private ensureShadowVisual(tracked: TrackedObject): Phaser.GameObjects.Ellipse | undefined {
    if (!this.areDropShadowsEnabled()) return undefined;
    if (tracked.shadowVisual || !tracked.shadowCaster) return tracked.shadowVisual;

    const ellipse = new Phaser.GameObjects.Ellipse(this.scene, 0, 0, 10, 10, this.config.dropShadow.color, 0);
    markGameObjectIgnoreSceneLighting(ellipse);
    ellipse.setBlendMode(Phaser.BlendModes.MULTIPLY);
    ellipse.setVisible(false);
    this.scene.add.existing(ellipse);
    tracked.shadowVisual = ellipse;
    return ellipse;
  }

  /**
   * Projects the caster bounds away from the current light direction.
   * This keeps dropped shadows cheap while still following the moving sun / moon.
   */
  private updateShadowTransform(tracked: TrackedObject): void {
    if (!tracked.shadowCaster || !tracked.shadowVisual) return;

    const bounds = this.getRenderableBounds(tracked.shadowCaster);
    if (!bounds) {
      tracked.shadowVisual.setVisible(false);
      tracked.shadowEnabled = false;
      tracked.shadowDirty = false;
      return;
    }

    const sun = this.getShadowLightPosition(bounds.centerX, bounds.bottom);
    const directionX = bounds.centerX - sun.x;
    const directionY = bounds.bottom - sun.y;
    const directionLength = Math.hypot(directionX, directionY) || 1;
    const normalX = directionX / directionLength;
    const normalY = directionY / directionLength;

    const solarStrength = Math.max(0, Math.sin(this.cycleTime * Math.PI));
    const nightShadowFactor = solarStrength > 0.05 ? 0 : 0.35;
    const opacity = lerpNumber(
      this.config.dropShadow.opacityNight,
      this.config.dropShadow.opacityDay,
      Math.max(solarStrength, nightShadowFactor)
    );
    const offsetLength =
      solarStrength > 0.05
        ? lerpNumber(this.config.dropShadow.maxOffset, this.config.dropShadow.minOffset, solarStrength)
        : lerpNumber(this.config.dropShadow.minOffset, this.config.dropShadow.maxOffset, 0.35);

    const width = Math.max(14, bounds.width * this.config.dropShadow.widthScale * (1 + offsetLength * 0.015));
    const height = Math.max(6, bounds.height * this.config.dropShadow.heightScale);
    const x = bounds.centerX + normalX * offsetLength;
    const y = bounds.bottom - height * 0.65 + normalY * offsetLength * 0.5;
    const angle = Phaser.Math.RadToDeg(Math.atan2(normalY, normalX));
    const depth = Math.max(-1000, (getGameObjectDepth(tracked.shadowCaster) ?? 0) - 0.5);

    tracked.shadowVisual.setPosition(x, y);
    tracked.shadowVisual.setSize(width, height);
    tracked.shadowVisual.setDisplaySize(width, height);
    tracked.shadowVisual.setRotation(Phaser.Math.DegToRad(angle));
    tracked.shadowVisual.setFillStyle(this.config.dropShadow.color, opacity);
    tracked.shadowVisual.setDepth(depth);
    tracked.shadowDirty = false;
  }

  /**
   * Dirty shadows bypass the throttled pass so movement-triggered updates land in the same frame.
   * The lower-frequency pass still handles stable shadows that only need periodic sun/moon reprojection.
   */
  private flushDirtyShadows(): void {
    this.trackedObjects.forEach((tracked) => {
      if (!tracked.shadowDirty) return;
      this.applyShadow(tracked, this.effectsEnabled && this.shouldRenderShadow(tracked));
    });
  }

  private getShadowLightPosition(fallbackX: number, fallbackY: number): { x: number; y: number } {
    if (this.keyLight) {
      return { x: this.keyLight.x, y: this.keyLight.y };
    }

    return {
      x: fallbackX - this.config.dropShadow.maxOffset,
      y: fallbackY - this.config.dropShadow.maxOffset * 0.75
    };
  }

  private getConfiguredAmbientColor(): number {
    return this.config.dayNightCycle.enabled ? this.calculateAmbientColor(this.cycleTime) : this.config.ambientColor;
  }

  /**
   * Converts the current ambient color into an overlay alpha used by ambient-only UI elements.
   */
  private getAmbientOverlayAlpha(): number {
    const color = Phaser.Display.Color.IntegerToColor(this.ambientColor);
    const luminance = (0.2126 * color.red + 0.7152 * color.green + 0.0722 * color.blue) / 255;
    return lerpNumber(0.3, 1, luminance);
  }

  /**
   * Subscribes to persisted game setting changes so lighting can toggle live without a scene restart.
   */
  private subscribeToOptions(): void {
    const optionsService = getSceneExternalComponent(this.scene, OptionsService);
    this.optionsChangedSubscription = optionsService?.settingsChanged.subscribe((change: { type: string; payload: unknown }) => {
      if (change.type !== "game") return;
      const newGameSettings = change.payload as GameSettings;
      this.setEffectsEnabled(newGameSettings.enableSceneLightingEffects);
    });
  }

  /**
   * Switching off lighting clears all tracked runtime state so the disabled path stays cheap.
   * Switching on lighting rebuilds tracking from the current scene graph.
   */
  private setEffectsEnabled(enabled: boolean): void {
    if (this.effectsEnabled === enabled) return;
    this.effectsEnabled = enabled;
    this.scene.lights.setAmbientColor(enabled ? this.getConfiguredAmbientColor() : 0xffffff);
    this.keyLight?.setVisible(enabled);

    if (enabled) {
      this.registerExistingSceneObjects();
      this.trackedObjects.forEach((tracked) => this.refreshTrackedObject(tracked));
      return;
    }

    this.clearTrackedObjects();
  }

  private clearTrackedObjects(): void {
    this.trackedObjects.forEach((tracked) => {
      tracked.gameObject.off(Phaser.GameObjects.Events.DESTROY, tracked.onDestroy);
      tracked.gameObject.off(HealthComponent.KilledEvent, tracked.onKilled);
      tracked.actorMovedSubscription?.unsubscribe();
      this.applyLighting(tracked, false);
      this.applyAmbient(tracked, false);
      tracked.shadowVisual?.destroy();
    });
    this.trackedObjects.clear();
    this.visibilityRefreshAccumulator = 0;
    this.lastVisibilityCameraState = undefined;
    this.shadowUpdateAccumulator = 0;
    this.lastCameraState = undefined;
  }

  private asLightingTarget(gameObject: Phaser.GameObjects.GameObject): LightingAwareGameObject | undefined {
    if (shouldIgnoreSceneLighting(gameObject)) return undefined;
    if (gameObject instanceof Phaser.GameObjects.Graphics) return undefined;
    const target = gameObject as LightingAwareGameObject;
    if (typeof target.setLighting !== "function") return undefined;
    return target;
  }

  private asAmbientTarget(gameObject: Phaser.GameObjects.GameObject): AmbientResponsiveGameObject | undefined {
    if (!shouldRespondToSceneAmbient(gameObject)) return undefined;
    const target = gameObject as AmbientResponsiveGameObject;
    if (typeof target.setAlpha !== "function") return undefined;
    return target;
  }

  private asShadowCaster(gameObject: Phaser.GameObjects.GameObject): ShadowCasterGameObject | undefined {
    if (!this.areDropShadowsEnabled()) return undefined;
    if (shouldIgnoreSceneLighting(gameObject) || !shouldCastSceneShadow(gameObject)) return undefined;
    if (gameObject instanceof Phaser.GameObjects.Graphics) return undefined;
    if (gameObject instanceof Phaser.GameObjects.Text) return undefined;
    if (gameObject instanceof Phaser.GameObjects.BitmapText) return undefined;
    if (gameObject instanceof Phaser.Tilemaps.TilemapLayer) return undefined;
    if (gameObject instanceof Phaser.GameObjects.Particles.ParticleEmitter) return undefined;
    if (gameObject.parentContainer && this.shouldContainerCastShadow(gameObject.parentContainer)) return undefined;
    const bounds = this.getRenderableBounds(gameObject);
    if (!bounds || !this.hasMeaningfulShadowBounds(bounds)) return undefined;
    return gameObject as ShadowCasterGameObject;
  }

  /**
   * Shadows are reserved for materially large world objects so tiny props and helper visuals
   * do not create unnecessary shadow objects or update work.
   */
  private hasMeaningfulShadowBounds(bounds: Phaser.Geom.Rectangle): boolean {
    return bounds.width >= 20 && bounds.height >= 14 && bounds.width * bounds.height >= 480;
  }

  private shouldContainerCastShadow(gameObject: Phaser.GameObjects.GameObject): boolean {
    if (!this.areDropShadowsEnabled()) return false;
    if (!(gameObject instanceof Phaser.GameObjects.Container)) return false;
    if (shouldIgnoreSceneLighting(gameObject) || !shouldCastSceneShadow(gameObject)) return false;
    return this.getRenderableBounds(gameObject) !== null;
  }

  /**
   * Central shadow gate so the entire dropped-shadow path can be disabled without touching
   * map config or scene settings while the implementation is being iterated on.
   */
  private areDropShadowsEnabled(): boolean {
    return DROP_SHADOWS_RUNTIME_ENABLED && this.config.dropShadow.enabled;
  }

  private getRenderableBounds(gameObject: Phaser.GameObjects.GameObject): Phaser.Geom.Rectangle | null {
    if (gameObject instanceof Phaser.GameObjects.Container) {
      return this.getContainerRenderableBounds(gameObject);
    }

    if ((gameObject as LightingAwareGameObject).visible === false) return null;
    return getGameObjectBoundsRaw(gameObject);
  }

  /**
   * Returns an expanded camera rect used only for shadow work.
   * Padding by three viewport widths/heights keeps nearby shadows warm in cache during camera motion.
   */
  private getExpandedShadowCullBounds(): Phaser.Geom.Rectangle {
    const worldView = this.scene.cameras.main.worldView;
    return new Phaser.Geom.Rectangle(
      worldView.x - worldView.width * 3,
      worldView.y - worldView.height * 3,
      worldView.width * 7,
      worldView.height * 7
    );
  }

  /**
   * Container bounds are cached because recursive child-bound aggregation is one of the more
   * expensive operations in the current lighting system. Dynamic prefabs explicitly invalidate
   * this cache via `syncGameObjectTree(...)`.
   */
  private getContainerRenderableBounds(container: Phaser.GameObjects.Container): Phaser.Geom.Rectangle | null {
    if (!this.dirtyRenderBounds.has(container)) {
      return this.renderBoundsCache.get(container) ?? null;
    }

    let aggregateBounds: Phaser.Geom.Rectangle | null = null;

    container.list.forEach((child) => {
      if (shouldIgnoreSceneLighting(child)) return;
      if ((child as LightingAwareGameObject).visible === false) return;
      const childBounds = child instanceof Phaser.GameObjects.Container
        ? this.getContainerRenderableBounds(child)
        : getGameObjectBoundsRaw(child);
      if (!childBounds) return;

      if (!aggregateBounds) {
        aggregateBounds = new Phaser.Geom.Rectangle(childBounds.x, childBounds.y, childBounds.width, childBounds.height);
        return;
      }

      const left = Math.min(aggregateBounds.x, childBounds.x);
      const top = Math.min(aggregateBounds.y, childBounds.y);
      const right = Math.max(aggregateBounds.right, childBounds.right);
      const bottom = Math.max(aggregateBounds.bottom, childBounds.bottom);
      aggregateBounds.setTo(left, top, right - left, bottom - top);
    });

    let cachedBounds: Phaser.Geom.Rectangle | null = null;
    if (aggregateBounds) {
      const resolvedBounds = aggregateBounds as Phaser.Geom.Rectangle;
      cachedBounds = new Phaser.Geom.Rectangle(
        resolvedBounds.x,
        resolvedBounds.y,
        resolvedBounds.width,
        resolvedBounds.height
      );
    }
    this.renderBoundsCache.set(container, cachedBounds);
    this.dirtyRenderBounds.delete(container);
    return cachedBounds;
  }

  /**
   * Marks cached bounds dirty for a root object and its container descendants.
   * This is used for dynamic prefabs such as walls and stairs when they replace child visuals.
   */
  private invalidateRenderableBounds(gameObject: Phaser.GameObjects.GameObject): void {
    this.renderBoundsCache.delete(gameObject);
    this.dirtyRenderBounds.add(gameObject);
    if (!(gameObject instanceof Phaser.GameObjects.Container)) return;
    gameObject.list.forEach((child) => this.invalidateRenderableBounds(child));
  }

  /**
   * Actor movement events are the cheapest reliable signal that a shadow caster subtree moved.
   * We only mark the tree dirty here; the shadow pass still owns the actual transform update cadence.
   */
  private subscribeToActorMovement(gameObject: Phaser.GameObjects.GameObject): Subscription | undefined {
    const actorTranslateComponent = getActorComponent(gameObject, ActorTranslateComponent);
    if (!actorTranslateComponent) return undefined;
    return actorTranslateComponent.actorMovedLogicalPosition.subscribe(() => {
      this.invalidateRenderableBounds(gameObject);
      this.markShadowDirtyForTree(gameObject);
    });
  }

  /**
   * Marks a root object and any tracked descendants for shadow recomputation.
   * This is used when movement or prefab mutations shift world-space bounds.
   */
  private markShadowDirtyForTree(gameObject: Phaser.GameObjects.GameObject): void {
    const tracked = this.trackedObjects.get(gameObject);
    if (tracked?.shadowCaster) {
      tracked.shadowDirty = true;
    }

    if (!(gameObject instanceof Phaser.GameObjects.Container)) return;
    gameObject.list.forEach((child) => this.markShadowDirtyForTree(child));
  }

  /**
   * Camera motion has no dedicated event in the current stack, so we watch scroll and zoom
   * and trigger an immediate shadow refresh when the view changes.
   */
  private didCameraStateChange(): boolean {
    const camera = this.scene.cameras.main;
    const nextState = {
      scrollX: camera.scrollX,
      scrollY: camera.scrollY,
      zoom: camera.zoom
    };

    if (!this.lastCameraState) {
      this.lastCameraState = nextState;
      return true;
    }

    const changed =
      this.lastCameraState.scrollX !== nextState.scrollX ||
      this.lastCameraState.scrollY !== nextState.scrollY ||
      this.lastCameraState.zoom !== nextState.zoom;

    this.lastCameraState = nextState;
    return changed;
  }

  /**
   * Lighting and ambient-only overlays should react immediately to camera pans even when shadow
   * support is fully disabled. This keeps visibility-based culling from lagging behind the viewport.
   */
  private didVisibilityCameraStateChange(): boolean {
    const camera = this.scene.cameras.main;
    const nextState = {
      scrollX: camera.scrollX,
      scrollY: camera.scrollY,
      zoom: camera.zoom
    };

    if (!this.lastVisibilityCameraState) {
      this.lastVisibilityCameraState = nextState;
      return true;
    }

    const changed =
      this.lastVisibilityCameraState.scrollX !== nextState.scrollX ||
      this.lastVisibilityCameraState.scrollY !== nextState.scrollY ||
      this.lastVisibilityCameraState.zoom !== nextState.zoom;

    this.lastVisibilityCameraState = nextState;
    return changed;
  }

  /**
   * Marks currently visible shadow casters dirty so the next shadow pass reprojects them
   * against the new camera context without touching the whole scene.
   */
  private markVisibleShadowCastersDirty(): void {
    const shadowCullBounds = this.getExpandedShadowCullBounds();
    this.trackedObjects.forEach((tracked) => {
      if (!tracked.shadowCaster) return;
      const bounds = this.getRenderableBounds(tracked.shadowCaster);
      if (!bounds) return;
      if (!Phaser.Geom.Rectangle.Overlaps(shadowCullBounds, bounds)) return;
      tracked.shadowDirty = true;
    });
  }

  private isContainer(gameObject: Phaser.GameObjects.GameObject): gameObject is Phaser.GameObjects.Container {
    return gameObject instanceof Phaser.GameObjects.Container;
  }

  private destroy(): void {
    this.scene.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, this.onAddedToScene, this);
    this.scene.events.off(Phaser.Scenes.Events.REMOVED_FROM_SCENE, this.onRemovedFromScene, this);
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
    this.optionsChangedSubscription?.unsubscribe();

    this.clearTrackedObjects();
    this.animatedLightUpdaters.clear();

    if (this.keyLight) {
      this.scene.lights.removeLight(this.keyLight);
      this.keyLight = undefined;
    }
  }
}

function lerpColor(from: number, to: number, amount: number): number {
  const t = Math.min(1, Math.max(0, amount));
  const fromR = (from >> 16) & 0xff;
  const fromG = (from >> 8) & 0xff;
  const fromB = from & 0xff;

  const toR = (to >> 16) & 0xff;
  const toG = (to >> 8) & 0xff;
  const toB = to & 0xff;

  const r = Math.round(fromR + (toR - fromR) * t);
  const g = Math.round(fromG + (toG - fromG) * t);
  const b = Math.round(fromB + (toB - fromB) * t);
  return (r << 16) | (g << 8) | b;
}

function lerpNumber(from: number, to: number, amount: number): number {
  const t = Math.min(1, Math.max(0, amount));
  return from + (to - from) * t;
}

function easeInOut(value: number): number {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

function easeIn(value: number): number {
  const t = Math.min(1, Math.max(0, value));
  return t * t;
}
