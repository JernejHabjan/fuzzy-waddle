import { type AoeZoneData, type StatusEffectData } from "@fuzzy-waddle/api-interfaces";
import { onSceneInitialized } from "../../data/game-object-helper";
import { getActorComponent } from "../../data/actor-component";
import { OwnerComponent } from "../components/owner-component";
import { StatusEffectComponent } from "../components/status-effect/status-effect-component";
import { HealthComponent } from "../components/combat/components/health-component";
import { getSceneService } from "../../world/services/scene-component-helpers";
import Phaser from "phaser";
import { RandomService } from "../../world/services/random.service";
import { TilemapComponent } from "../../world/tilemap/tilemap.component";
import { EffectsAnims } from "../../animations/effects";
import { AudioService } from "../../world/services/audio.service";

interface ZoneVisual {
  zoneId: string;
  graphics: Phaser.GameObjects.Graphics;
  pulseTimer: Phaser.Time.TimerEvent;
  animSprite?: Phaser.GameObjects.Sprite;
  loopingSound?: Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound | null;
}

export class AoeZoneManager {
  private activeZones: AoeZoneData[] = [];
  private zoneVisuals: Map<string, ZoneVisual> = new Map();
  private randomService!: RandomService;
  private audioService?: AudioService;

  constructor(private readonly scene: Phaser.Scene) {
    onSceneInitialized(this.scene, this.init, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  private init(): void {
    this.randomService = getSceneService(this.scene, RandomService)!;
    this.audioService = getSceneService(this.scene, AudioService);
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
  }

  createZone(data: Omit<AoeZoneData, "id" | "remainingTime" | "lastTickTime">): string {
    const zoneId = `zone_${Date.now()}_${this.randomService.random().toString(36).substr(2, 9)}`;
    const zone: AoeZoneData = {
      ...data,
      id: zoneId,
      remainingTime: data.duration,
      lastTickTime: this.scene.time.now
    };

    this.activeZones.push(zone);
    this.createZoneVisual(zone);

    return zoneId;
  }

  removeZone(id: string): void {
    const index = this.activeZones.findIndex((z) => z.id === id);
    if (index !== -1) {
      this.activeZones.splice(index, 1);
      this.removeZoneVisual(id);
    }
  }

  private update(_time: number, delta: number): void {
    const now = this.scene.time.now;
    const zonesToRemove: string[] = [];

    for (const zone of this.activeZones) {
      // Decrement remaining time
      zone.remainingTime -= delta;

      // Check for tick
      if (zone.lastTickTime !== undefined) {
        const timeSinceLastTick = now - zone.lastTickTime;

        if (timeSinceLastTick >= zone.tickInterval) {
          this.applyZoneEffects(zone);
          zone.lastTickTime = now;
        }
      }

      // Update visual fade based on remaining time
      this.updateZoneVisualFade(zone);

      // Check if zone expired
      if (zone.remainingTime <= 0) {
        zonesToRemove.push(zone.id);
      }
    }

    // Remove expired zones
    for (const id of zonesToRemove) {
      this.removeZone(id);
    }
  }

  private applyZoneEffects(zone: AoeZoneData): void {
    const actorsInZone = this.findActorsInZone(zone);

    for (const actor of actorsInZone) {
      // Check if we should affect this actor
      const ownerComponent = getActorComponent(actor, OwnerComponent);
      const actorPlayerId = ownerComponent?.getOwner() ?? -1;

      const isAlly = actorPlayerId === zone.sourcePlayerId;
      const isEnemy = actorPlayerId !== zone.sourcePlayerId && actorPlayerId >= 0;

      if ((isAlly && !zone.affectsAllies) || (isEnemy && !zone.affectsEnemies)) {
        continue;
      }

      // Apply effect while inside
      if (zone.effectWhileInside) {
        const statusEffectComponent = getActorComponent(actor, StatusEffectComponent);
        if (statusEffectComponent) {
          const effect: StatusEffectData = {
            ...zone.effectWhileInside,
            sourceActorId: undefined // Zone is the source
          };
          statusEffectComponent.applyEffect(effect);
        }
      }
    }
  }

  private findActorsInZone(zone: AoeZoneData): Phaser.GameObjects.GameObject[] {
    const actors: Phaser.GameObjects.GameObject[] = [];
    const radiusInPixels = this.getRadiusInPixels(zone.radius);

    // Iterate through all game objects that have health (are units/buildings)
    for (const gameObject of this.scene.children.list) {
      const healthComponent = getActorComponent(gameObject, HealthComponent);
      if (!healthComponent || !healthComponent.alive) continue;

      // Get actor position
      const actorTransform = this.getActorWorldPosition(gameObject);
      if (!actorTransform) continue;

      // Check if within radius
      const distance = Phaser.Math.Distance.Between(
        zone.worldPosition.x,
        zone.worldPosition.y,
        actorTransform.x,
        actorTransform.y
      );

      if (distance <= radiusInPixels) {
        actors.push(gameObject);
      }
    }

    return actors;
  }

  private getActorWorldPosition(gameObject: Phaser.GameObjects.GameObject): { x: number; y: number } | null {
    if ("x" in gameObject && "y" in gameObject) {
      return { x: gameObject.x as number, y: gameObject.y as number };
    }
    return null;
  }

  private getRadiusInPixels(radiusTiles: number): number {
    // Approximate conversion - in isometric, we use the diagonal distance
    // This should be calibrated based on actual tile dimensions
    return radiusTiles * TilemapComponent.tileWidth;
  }

  private createZoneVisual(zone: AoeZoneData): void {
    const graphics = this.scene.add.graphics();
    const radiusInPixels = this.getRadiusInPixels(zone.radius);

    // Draw zone ellipse (for isometric perspective)
    this.drawZoneCircle(
      graphics,
      zone.worldPosition.x,
      zone.worldPosition.y,
      radiusInPixels,
      zone.tintColor ?? 0xffffff
    );

    // Create animated sprite effect if visualEffect is defined
    let animSprite: Phaser.GameObjects.Sprite | undefined;
    if (zone.visualEffect) {
      animSprite = this.createZoneAnimation(zone);
    }

    // Play looping sound if defined (using spatial audio based on zone position)
    let loopingSound: Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound | null =
      null;
    if (zone.sounds?.loop && this.audioService) {
      // Use the graphics object as the spatial position source
      loopingSound = this.audioService.playSpatialAudio(graphics, zone.sounds.loop, { loop: true, volume: 50 });
    }

    // Create pulse animation
    const pulseTimer = this.scene.time.addEvent({
      delay: 500,
      callback: () => this.pulseZone(zone.id),
      loop: true
    });

    this.zoneVisuals.set(zone.id, {
      zoneId: zone.id,
      graphics,
      pulseTimer,
      animSprite,
      loopingSound
    });
  }

  private createZoneAnimation(zone: AoeZoneData): Phaser.GameObjects.Sprite | undefined {
    // Map visual effect names to actual animations
    const animationMap: Record<string, string> = {
      fire_zone_effect: EffectsAnims.ANIM_IMPACT_5, // Fire effect
      healing_rain_effect: EffectsAnims.ANIM_IMPACT_23 // Healing effect
    };

    const animName = zone.visualEffect ? animationMap[zone.visualEffect] : undefined;
    if (!animName) return undefined;

    // Create looping animated sprite at zone center
    const sprite = EffectsAnims.createAndPlayEffectAnimation(
      this.scene,
      animName,
      zone.worldPosition.x,
      zone.worldPosition.y
    );

    // Make it loop instead of destroy on complete
    sprite.off("animationcomplete");
    sprite.on("animationcomplete", () => {
      if (sprite.active) {
        sprite.play(animName);
      }
    });

    // Apply tint color if defined
    if (zone.tintColor) {
      sprite.setTint(zone.tintColor);
    }

    // Set blend mode for visual effect
    sprite.setBlendMode(Phaser.BlendModes.ADD);
    sprite.setAlpha(0.7);
    sprite.setDepth(100);

    return sprite;
  }

  private drawZoneCircle(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    radius: number,
    color: number
  ): void {
    graphics.clear();

    // Draw filled semi-transparent ellipse for isometric perspective
    // Isometric view compresses the vertical axis by ~0.5
    const ellipseWidth = radius * 2;
    const ellipseHeight = radius * 2 * 0.5; // Compressed for isometric

    graphics.fillStyle(color, 0.2);
    graphics.fillEllipse(x, y, ellipseWidth, ellipseHeight);

    // Draw border
    graphics.lineStyle(2, color, 0.6);
    graphics.strokeEllipse(x, y, ellipseWidth, ellipseHeight);
  }

  private pulseZone(zoneId: string): void {
    const visual = this.zoneVisuals.get(zoneId);
    const zone = this.activeZones.find((z) => z.id === zoneId);

    if (!visual || !zone) return;

    const radiusInPixels = this.getRadiusInPixels(zone.radius);

    // Create pulse effect by briefly increasing radius
    const pulseRadius = radiusInPixels * 1.1;
    this.drawZoneCircle(
      visual.graphics,
      zone.worldPosition.x,
      zone.worldPosition.y,
      pulseRadius,
      zone.tintColor ?? 0xffffff
    );

    // Return to normal after short delay
    this.scene.time.delayedCall(100, () => {
      if (visual.graphics.active) {
        this.drawZoneCircle(
          visual.graphics,
          zone.worldPosition.x,
          zone.worldPosition.y,
          radiusInPixels,
          zone.tintColor ?? 0xffffff
        );
      }
    });
  }

  private updateZoneVisualFade(zone: AoeZoneData): void {
    const visual = this.zoneVisuals.get(zone.id);
    if (!visual) return;

    // Calculate fade based on remaining time (start fading in last 20% of duration)
    const fadeThreshold = zone.duration * 0.2;
    if (zone.remainingTime < fadeThreshold) {
      const alpha = zone.remainingTime / fadeThreshold;
      visual.graphics.setAlpha(alpha);
      // Also fade the animated sprite if it exists
      if (visual.animSprite) {
        visual.animSprite.setAlpha(0.7 * alpha);
      }
      // Fade out the looping sound
      if (visual.loopingSound && !visual.loopingSound.isPaused && this.audioService) {
        // Only start fading if we haven't already started
        if (visual.loopingSound.volume > 0.01) {
          this.audioService.fadeOut(visual.loopingSound, fadeThreshold);
        }
      }
    }
  }

  private removeZoneVisual(zoneId: string): void {
    const visual = this.zoneVisuals.get(zoneId);
    if (visual) {
      visual.pulseTimer.destroy();
      visual.graphics.destroy();
      visual.animSprite?.destroy();
      visual.loopingSound?.stop();
      visual.loopingSound?.destroy();
      this.zoneVisuals.delete(zoneId);
    }
  }

  getZonesAtPosition(pos: { x: number; y: number }): AoeZoneData[] {
    const zones: AoeZoneData[] = [];

    for (const zone of this.activeZones) {
      const radiusInPixels = this.getRadiusInPixels(zone.radius);
      const distance = Phaser.Math.Distance.Between(zone.worldPosition.x, zone.worldPosition.y, pos.x, pos.y);

      if (distance <= radiusInPixels) {
        zones.push(zone);
      }
    }

    return zones;
  }

  getData(): AoeZoneData[] {
    return this.activeZones.map((z) => ({ ...z }));
  }

  setData(zones: AoeZoneData[]): void {
    // Clear existing zones
    for (const zone of [...this.activeZones]) {
      this.removeZone(zone.id);
    }

    // Restore zones from save data
    for (const zone of zones) {
      this.activeZones.push({
        ...zone,
        lastTickTime: this.scene.time.now
      });
      this.createZoneVisual(zone);
    }
  }

  private destroy(): void {
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);

    // Clean up all zone visuals
    for (const [id] of this.zoneVisuals) {
      this.removeZoneVisual(id);
    }

    this.activeZones = [];
    this.zoneVisuals.clear();
  }
}
