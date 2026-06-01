import type { ProbableWaffleLightingAmbientKeyframe } from "@fuzzy-waddle/api-interfaces";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import type GameProbableWaffleScene from "../../scenes/GameProbableWaffleScene";
import {
  type ResolvedSceneLightingConfig,
  resolveSceneLightingConfig
} from "./scene-lighting.config";

type LightingAwareGameObject = Phaser.GameObjects.GameObject & {
  setLighting?: (enable: boolean) => Phaser.GameObjects.GameObject;
  visible?: boolean;
  active?: boolean;
};

type TrackedObject = {
  gameObject: Phaser.GameObjects.GameObject;
  lightingTarget: LightingAwareGameObject;
  lightingEnabled: boolean;
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
  private visibilityRefreshAccumulator = 0;
  private readonly visibilityRefreshIntervalMs = 200;

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

    this.registerExistingSceneObjects();
    this.setupLighting();
  }

  registerGameObject(gameObject: Phaser.GameObjects.GameObject): void {
    if (!this.config.enabled || !gameObject || this.trackedObjects.has(gameObject)) return;

    if (this.isContainer(gameObject)) {
      gameObject.list.forEach((child) => this.registerGameObject(child));
    }

    const lightingTarget = this.asLightingTarget(gameObject);
    if (!lightingTarget) return;

    const tracked: TrackedObject = {
      gameObject,
      lightingTarget,
      lightingEnabled: false,
      onDestroy: () => this.unregisterGameObject(gameObject),
      onKilled: () => this.unregisterGameObject(gameObject)
    };

    this.trackedObjects.set(gameObject, tracked);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, tracked.onDestroy);
    gameObject.once(HealthComponent.KilledEvent, tracked.onKilled);
    this.refreshTrackedObject(tracked);
  }

  unregisterGameObject(gameObject: Phaser.GameObjects.GameObject): void {
    const tracked = this.trackedObjects.get(gameObject);
    if (!tracked) return;
    this.applyLighting(tracked, false);
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
    this.registerGameObject(gameObject);
  }

  private onRemovedFromScene(gameObject: Phaser.GameObjects.GameObject): void {
    this.unregisterGameObject(gameObject);
  }

  private registerExistingSceneObjects(): void {
    this.scene.children.list.forEach((child) => this.registerGameObject(child));
  }

  private setupLighting(): void {
    if (this.config.dayNightCycle.enabled) {
      this.ambientColor = this.calculateAmbientColor(this.getNormalizedCycleTime(this.scene.time.now));
    } else {
      this.ambientColor = this.config.ambientColor;
    }
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
    }
  }

  private update(time: number, delta: number): void {
    if (this.config.dayNightCycle.enabled) {
      const cycleTime = this.getNormalizedCycleTime(time);
      const nextAmbient = this.calculateAmbientColor(cycleTime);
      if (nextAmbient !== this.ambientColor) {
        this.ambientColor = nextAmbient;
        this.scene.lights.setAmbientColor(nextAmbient);
      }
      this.updateKeyLight(cycleTime);
    }

    this.visibilityRefreshAccumulator += delta;
    if (this.visibilityRefreshAccumulator >= this.visibilityRefreshIntervalMs) {
      this.visibilityRefreshAccumulator = 0;
      this.trackedObjects.forEach((tracked) => this.refreshTrackedObject(tracked));
    }
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
    const shouldBeLit =
      tracked.gameObject.scene === this.scene &&
      (tracked.lightingTarget.active ?? true) &&
      (tracked.lightingTarget.visible ?? true);
    this.applyLighting(tracked, shouldBeLit);
  }

  private applyLighting(tracked: TrackedObject, enabled: boolean): void {
    if (tracked.lightingEnabled === enabled) return;
    tracked.lightingTarget.setLighting?.(enabled);
    tracked.lightingEnabled = enabled;
  }

  private asLightingTarget(gameObject: Phaser.GameObjects.GameObject): LightingAwareGameObject | undefined {
    const target = gameObject as LightingAwareGameObject;
    if (typeof target.setLighting !== "function") return undefined;
    return target;
  }

  private isContainer(gameObject: Phaser.GameObjects.GameObject): gameObject is Phaser.GameObjects.Container {
    return gameObject instanceof Phaser.GameObjects.Container;
  }

  private destroy(): void {
    this.scene.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, this.onAddedToScene, this);
    this.scene.events.off(Phaser.Scenes.Events.REMOVED_FROM_SCENE, this.onRemovedFromScene, this);
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);

    this.trackedObjects.forEach((tracked) => {
      tracked.gameObject.off(Phaser.GameObjects.Events.DESTROY, tracked.onDestroy);
      tracked.gameObject.off(HealthComponent.KilledEvent, tracked.onKilled);
      this.applyLighting(tracked, false);
    });
    this.trackedObjects.clear();
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
