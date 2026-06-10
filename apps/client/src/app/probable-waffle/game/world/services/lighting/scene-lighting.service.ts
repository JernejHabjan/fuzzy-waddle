import type { ProbableWaffleLightingAmbientKeyframe } from "@fuzzy-waddle/api-interfaces";
import { Subscription } from "rxjs";
import { GameSettings } from "../../../core/gameSettings";
import { getGameObjectBoundsRaw, getGameObjectDepth } from "../../../data/game-object-helper";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { OptionsService } from "../../../../gui/options/options.service";
import type GameProbableWaffleScene from "../../scenes/GameProbableWaffleScene";
import { getSceneExternalComponent } from "../scene-component-helpers";
import {
  markGameObjectIgnoreSceneLighting,
  shouldCastSceneShadow,
  shouldIgnoreSceneLighting
} from "./lighting-game-object-meta";
import {
  type ResolvedSceneLightingConfig,
  resolveSceneLightingConfig
} from "./scene-lighting.config";

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

type TrackedObject = {
  gameObject: Phaser.GameObjects.GameObject;
  lightingTarget?: LightingAwareGameObject;
  shadowCaster?: ShadowCasterGameObject;
  shadowVisual?: Phaser.GameObjects.Ellipse;
  lightingEnabled: boolean;
  shadowEnabled: boolean;
  onDestroy: () => void;
  onKilled: () => void;
};

type AnimatedLightUpdater = (time: number, delta: number) => void;

export class SceneLightingService {
  private readonly config: ResolvedSceneLightingConfig;
  private readonly trackedObjects = new Map<Phaser.GameObjects.GameObject, TrackedObject>();
  private readonly animatedLightUpdaters = new Set<AnimatedLightUpdater>();

  private keyLight?: Phaser.GameObjects.Light;
  private ambientColor = 0xffffff;
  private cycleTime = 0;
  private effectsEnabled = false;
  private visibilityRefreshAccumulator = 0;
  private readonly visibilityRefreshIntervalMs = 200;
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

  syncGameObjectTree(gameObject: Phaser.GameObjects.GameObject): void {
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

    const tracked: TrackedObject = {
      gameObject,
      lightingTarget: this.asLightingTarget(gameObject),
      shadowCaster: this.asShadowCaster(gameObject),
      lightingEnabled: false,
      shadowEnabled: false,
      onDestroy: () => this.unregisterGameObject(gameObject),
      onKilled: () => this.unregisterGameObject(gameObject)
    };

    if (!tracked.lightingTarget && !tracked.shadowCaster) return;

    this.trackedObjects.set(gameObject, tracked);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, tracked.onDestroy);
    gameObject.once(HealthComponent.KilledEvent, tracked.onKilled);
    this.refreshTrackedObject(tracked);
  }

  unregisterGameObject(gameObject: Phaser.GameObjects.GameObject): void {
    const tracked = this.trackedObjects.get(gameObject);
    if (!tracked) return;
    this.applyLighting(tracked, false);
    this.applyShadow(tracked, false);
    tracked.shadowVisual?.destroy();
    tracked.shadowVisual = undefined;
    tracked.gameObject.off(Phaser.GameObjects.Events.DESTROY, tracked.onDestroy);
    tracked.gameObject.off(HealthComponent.KilledEvent, tracked.onKilled);
    this.trackedObjects.delete(gameObject);
  }

  addAnimatedLightUpdater(updater: AnimatedLightUpdater): () => void {
    this.animatedLightUpdaters.add(updater);
    return () => this.animatedLightUpdaters.delete(updater);
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

  private setupLighting(): void {
    this.effectsEnabled = GameSettings.loadFromLocalStorage().enableSceneLightingEffects;
    this.cycleTime = this.config.dayNightCycle.enabled ? this.getNormalizedCycleTime(this.scene.time.now) : 0;
    this.ambientColor = this.effectsEnabled ? this.getConfiguredAmbientColor() : 0xffffff;
    this.scene.lights.setAmbientColor(this.ambientColor);

    if (this.config.keyLight.enabled) {
      const center = this.getMapCenter();
      this.keyLight = this.scene.lights.addLight(
        center.x,
        center.y,
        this.config.keyLight.radius,
        this.config.keyLight.color,
        this.config.keyLight.intensity,
        this.config.keyLight.z
      );
      this.updateKeyLight(this.cycleTime);
      this.keyLight.setVisible(this.effectsEnabled);
    }
  }

  private update(time: number, delta: number): void {
    if (!this.effectsEnabled) {
      return;
    }

    if (this.config.dayNightCycle.enabled) {
      this.cycleTime = this.getNormalizedCycleTime(time);
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

    this.trackedObjects.forEach((tracked) => {
      if (tracked.shadowEnabled) {
        this.updateShadowTransform(tracked);
      }
    });

    this.animatedLightUpdaters.forEach((updater) => updater(time, delta));
  }

  private updateKeyLight(cycleTime: number): void {
    if (!this.keyLight) return;

    const center = this.getMapCenter();
    const radians = cycleTime * Math.PI * 2;
    this.keyLight.x = center.x + Math.cos(radians) * this.config.keyLight.orbitRadius;
    this.keyLight.y = center.y + Math.sin(radians) * this.config.keyLight.orbitRadius * 0.65;
  }

  private getMapCenter(): { x: number; y: number } {
    return {
      x: this.scene.tilemap.widthInPixels * 0.5,
      y: this.scene.tilemap.heightInPixels * 0.5
    };
  }

  private getNormalizedCycleTime(time: number): number {
    const duration = Math.max(1, this.config.dayNightCycle.durationMs);
    const startOffset = this.config.dayNightCycle.startTimeNormalized * duration;
    const cyclePosition = (time + startOffset) % duration;
    return cyclePosition / duration;
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
    const shouldRenderEffects = this.effectsEnabled && this.shouldRenderEffects(tracked.gameObject);
    this.applyLighting(tracked, shouldRenderEffects);
    this.applyShadow(tracked, shouldRenderEffects);
  }

  private shouldRenderEffects(gameObject: Phaser.GameObjects.GameObject): boolean {
    if (gameObject.scene !== this.scene) return false;
    const active = (gameObject as LightingAwareGameObject).active ?? true;
    const visible = (gameObject as LightingAwareGameObject).visible ?? true;
    if (!active || !visible) return false;

    const bounds = this.getRenderableBounds(gameObject);
    if (!bounds) return false;
    return Phaser.Geom.Rectangle.Overlaps(this.scene.cameras.main.worldView, bounds);
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

  private applyShadow(tracked: TrackedObject, enabled: boolean): void {
    if (!this.config.dropShadow.enabled || !tracked.shadowCaster) return;
    const shadowVisual = this.ensureShadowVisual(tracked);
    if (!shadowVisual) return;

    if (!enabled) {
      shadowVisual.setVisible(false);
      tracked.shadowEnabled = false;
      return;
    }

    tracked.shadowEnabled = true;
    shadowVisual.setVisible(true);
    this.updateShadowTransform(tracked);
  }

  private ensureShadowVisual(tracked: TrackedObject): Phaser.GameObjects.Ellipse | undefined {
    if (tracked.shadowVisual || !tracked.shadowCaster) return tracked.shadowVisual;

    const ellipse = new Phaser.GameObjects.Ellipse(this.scene, 0, 0, 10, 10, this.config.dropShadow.color, 0);
    markGameObjectIgnoreSceneLighting(ellipse);
    ellipse.setBlendMode(Phaser.BlendModes.MULTIPLY);
    ellipse.setVisible(false);
    this.scene.add.existing(ellipse);
    tracked.shadowVisual = ellipse;
    return ellipse;
  }

  private updateShadowTransform(tracked: TrackedObject): void {
    if (!tracked.shadowCaster || !tracked.shadowVisual) return;

    const bounds = this.getRenderableBounds(tracked.shadowCaster);
    if (!bounds) {
      tracked.shadowVisual.setVisible(false);
      tracked.shadowEnabled = false;
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

  private subscribeToOptions(): void {
    const optionsService = getSceneExternalComponent(this.scene, OptionsService);
    this.optionsChangedSubscription = optionsService?.settingsChanged.subscribe((change: { type: string; payload: unknown }) => {
      if (change.type !== "game") return;
      const newGameSettings = change.payload as GameSettings;
      this.setEffectsEnabled(newGameSettings.enableSceneLightingEffects);
    });
  }

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
      this.applyLighting(tracked, false);
      tracked.shadowVisual?.destroy();
    });
    this.trackedObjects.clear();
    this.visibilityRefreshAccumulator = 0;
  }

  private asLightingTarget(gameObject: Phaser.GameObjects.GameObject): LightingAwareGameObject | undefined {
    if (shouldIgnoreSceneLighting(gameObject)) return undefined;
    if (gameObject instanceof Phaser.GameObjects.Graphics) return undefined;
    const target = gameObject as LightingAwareGameObject;
    if (typeof target.setLighting !== "function") return undefined;
    return target;
  }

  private asShadowCaster(gameObject: Phaser.GameObjects.GameObject): ShadowCasterGameObject | undefined {
    if (shouldIgnoreSceneLighting(gameObject) || !shouldCastSceneShadow(gameObject)) return undefined;
    if (gameObject instanceof Phaser.GameObjects.Graphics) return undefined;
    if (gameObject instanceof Phaser.GameObjects.Text) return undefined;
    if (gameObject instanceof Phaser.GameObjects.BitmapText) return undefined;
    if (gameObject instanceof Phaser.Tilemaps.TilemapLayer) return undefined;
    if (gameObject instanceof Phaser.GameObjects.Particles.ParticleEmitter) return undefined;
    if (gameObject.parentContainer && this.shouldContainerCastShadow(gameObject.parentContainer)) return undefined;
    if (!this.getRenderableBounds(gameObject)) return undefined;
    return gameObject as ShadowCasterGameObject;
  }

  private shouldContainerCastShadow(gameObject: Phaser.GameObjects.GameObject): boolean {
    if (!(gameObject instanceof Phaser.GameObjects.Container)) return false;
    if (shouldIgnoreSceneLighting(gameObject) || !shouldCastSceneShadow(gameObject)) return false;
    return this.getRenderableBounds(gameObject) !== null;
  }

  private getRenderableBounds(gameObject: Phaser.GameObjects.GameObject): Phaser.Geom.Rectangle | null {
    if (gameObject instanceof Phaser.GameObjects.Container) {
      return this.getContainerRenderableBounds(gameObject);
    }

    if ((gameObject as LightingAwareGameObject).visible === false) return null;
    return getGameObjectBoundsRaw(gameObject);
  }

  private getContainerRenderableBounds(container: Phaser.GameObjects.Container): Phaser.Geom.Rectangle | null {
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

    return aggregateBounds;
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
