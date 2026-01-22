import { AoeZoneData, StatusEffectData } from '@fuzzy-waddle/api-interfaces';
import { onSceneInitialized } from '../../data/game-object-helper';
import { getActorComponent } from '../../data/actor-component';
import { OwnerComponent } from '../components/owner-component';
import { StatusEffectComponent } from '../components/status-effect/status-effect-component';
import { HealthComponent } from '../components/combat/components/health-component';
import { getSceneService } from '../../world/services/scene-component-helpers';
import { NavigationService } from '../../world/services/navigation.service';
import Phaser from 'phaser';

interface ZoneVisual {
  zoneId: string;
  graphics: Phaser.GameObjects.Graphics;
  pulseTimer: Phaser.Time.TimerEvent;
}

export class AoeZoneManager {
  private activeZones: AoeZoneData[] = [];
  private zoneVisuals: Map<string, ZoneVisual> = new Map();
  private navigationService?: NavigationService;

  constructor(private readonly scene: Phaser.Scene) {
    onSceneInitialized(this.scene, this.init, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  private init(): void {
    this.navigationService = getSceneService(this.scene, NavigationService);
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
  }

  createZone(data: Omit<AoeZoneData, 'id' | 'remainingTime' | 'lastTickTime'>): string {
    const zoneId = `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
      const distance = Phaser.Math.Distance.Between(zone.position.x, zone.position.y, actorTransform.x, actorTransform.y);

      if (distance <= radiusInPixels) {
        actors.push(gameObject);
      }
    }

    return actors;
  }

  private getActorWorldPosition(gameObject: Phaser.GameObjects.GameObject): { x: number; y: number } | null {
    if ('x' in gameObject && 'y' in gameObject) {
      return { x: gameObject.x as number, y: gameObject.y as number };
    }
    return null;
  }

  private getRadiusInPixels(radiusTiles: number): number {
    // Approximate conversion - in isometric, we use the diagonal distance
    // This should be calibrated based on actual tile dimensions
    const tileWidth = 64; // Default tile width, should get from tilemap
    return radiusTiles * tileWidth;
  }

  private createZoneVisual(zone: AoeZoneData): void {
    const graphics = this.scene.add.graphics();
    const radiusInPixels = this.getRadiusInPixels(zone.radius);

    // Draw zone circle
    this.drawZoneCircle(graphics, zone.position.x, zone.position.y, radiusInPixels, zone.tintColor ?? 0xffffff);

    // Create pulse animation
    const pulseTimer = this.scene.time.addEvent({
      delay: 500,
      callback: () => this.pulseZone(zone.id),
      loop: true
    });

    this.zoneVisuals.set(zone.id, {
      zoneId: zone.id,
      graphics,
      pulseTimer
    });
  }

  private drawZoneCircle(graphics: Phaser.GameObjects.Graphics, x: number, y: number, radius: number, color: number): void {
    graphics.clear();

    // Draw filled semi-transparent circle
    graphics.fillStyle(color, 0.2);
    graphics.fillCircle(x, y, radius);

    // Draw border
    graphics.lineStyle(2, color, 0.6);
    graphics.strokeCircle(x, y, radius);
  }

  private pulseZone(zoneId: string): void {
    const visual = this.zoneVisuals.get(zoneId);
    const zone = this.activeZones.find((z) => z.id === zoneId);

    if (!visual || !zone) return;

    const radiusInPixels = this.getRadiusInPixels(zone.radius);

    // Create pulse effect by briefly increasing radius
    const pulseRadius = radiusInPixels * 1.1;
    this.drawZoneCircle(visual.graphics, zone.position.x, zone.position.y, pulseRadius, zone.tintColor ?? 0xffffff);

    // Return to normal after short delay
    this.scene.time.delayedCall(100, () => {
      if (visual.graphics.active) {
        this.drawZoneCircle(visual.graphics, zone.position.x, zone.position.y, radiusInPixels, zone.tintColor ?? 0xffffff);
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
    }
  }

  private removeZoneVisual(zoneId: string): void {
    const visual = this.zoneVisuals.get(zoneId);
    if (visual) {
      visual.pulseTimer.destroy();
      visual.graphics.destroy();
      this.zoneVisuals.delete(zoneId);
    }
  }

  getZonesAtPosition(pos: { x: number; y: number }): AoeZoneData[] {
    const zones: AoeZoneData[] = [];

    for (const zone of this.activeZones) {
      const radiusInPixels = this.getRadiusInPixels(zone.radius);
      const distance = Phaser.Math.Distance.Between(zone.position.x, zone.position.y, pos.x, pos.y);

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
