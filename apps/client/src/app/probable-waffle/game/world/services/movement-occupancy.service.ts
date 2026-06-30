import type { ActorId, Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import { getActorComponent } from "../../data/actor-component";
import { isGameObjectActiveInActiveScene } from "../../data/game-object-helper";
import { HealthComponent } from "../../entity/components/combat/components/health-component";
import { ActorTranslateComponent } from "../../entity/components/movement/actor-translate-component";
import { FlyingComponent } from "../../entity/components/movement/flying-component";
import { IdComponent } from "../../entity/components/id-component";
import { RepresentableComponent } from "../../entity/components/representable-component";
import { getTileCoordsUnderObject, getTileCoordsUnderObjectAtTile } from "../../library/tile-under-object";
import { TilemapComponent } from "../tilemap/tilemap.component";
import { ActorIndexSystem } from "./ActorIndexSystem";
import { getSceneComponent, getSceneService } from "./scene-component-helpers";

interface Reservation {
  actorId: ActorId;
  keys: string[];
}

/**
 * Owns dynamic actor footprint reservations separately from static terrain navigation.
 * Occupancy keys include logical height so floor and wall actors can share the same x/y tile.
 */
export class MovementOccupancyService {
  private readonly stepReservations = new Map<ActorId, Reservation>();
  private readonly destinationReservations = new Map<ActorId, Reservation>();

  constructor(private readonly scene: Phaser.Scene) {
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  getActorFootprintAtTile(actor: Phaser.GameObjects.GameObject, centerTile: Vector2Simple): Vector2Simple[] {
    const tilemap = getSceneComponent(this.scene, TilemapComponent)?.tilemap;
    if (!tilemap) return [centerTile];
    return getTileCoordsUnderObjectAtTile(tilemap, actor, centerTile);
  }

  isFootprintFree(actorId: ActorId, footprint: Vector2Simple[], heightLayer: number): boolean {
    return this.getBlockingActors(actorId, footprint, heightLayer).length === 0;
  }

  reserveStep(actorId: ActorId, footprint: Vector2Simple[], heightLayer: number): boolean {
    return this.reserve(actorId, footprint, heightLayer, this.stepReservations);
  }

  reserveDestination(actorId: ActorId, footprint: Vector2Simple[], heightLayer: number): boolean {
    return this.reserve(actorId, footprint, heightLayer, this.destinationReservations);
  }

  releaseStep(actorId: ActorId): void {
    this.stepReservations.delete(actorId);
  }

  releaseDestination(actorId: ActorId): void {
    this.destinationReservations.delete(actorId);
  }

  releaseAll(actorId: ActorId): void {
    this.releaseStep(actorId);
    this.releaseDestination(actorId);
  }

  getBlockingActors(actorId: ActorId, footprint: Vector2Simple[], heightLayer: number): ActorId[] {
    const keys = footprint.map((tile) => this.toKey(tile, heightLayer));
    const blockers = new Set<ActorId>();

    this.collectReservationBlockers(blockers, actorId, keys, this.stepReservations);
    this.collectReservationBlockers(blockers, actorId, keys, this.destinationReservations);
    this.collectCurrentOccupancyBlockers(blockers, actorId, keys);

    return Array.from(blockers).sort();
  }

  hasActiveStepReservation(actorId: ActorId): boolean {
    return this.stepReservations.has(actorId);
  }

  private reserve(
    actorId: ActorId,
    footprint: Vector2Simple[],
    heightLayer: number,
    reservations: Map<ActorId, Reservation>
  ): boolean {
    const keys = footprint.map((tile) => this.toKey(tile, heightLayer));
    if (this.getBlockingActors(actorId, footprint, heightLayer).length > 0) {
      return false;
    }
    reservations.set(actorId, { actorId, keys });
    return true;
  }

  private collectReservationBlockers(
    blockers: Set<ActorId>,
    actorId: ActorId,
    keys: string[],
    reservations: Map<ActorId, Reservation>
  ): void {
    const keySet = new Set(keys);
    for (const reservation of reservations.values()) {
      if (reservation.actorId === actorId) continue;
      if (reservation.keys.some((key) => keySet.has(key))) {
        blockers.add(reservation.actorId);
      }
    }
  }

  private collectCurrentOccupancyBlockers(blockers: Set<ActorId>, actorId: ActorId, keys: string[]): void {
    const tilemap = getSceneComponent(this.scene, TilemapComponent)?.tilemap;
    const actorIndex = getSceneService(this.scene, ActorIndexSystem);
    if (!tilemap || !actorIndex) return;

    const keySet = new Set(keys);
    for (const actor of actorIndex.getAllIdActors()) {
      if (!isGameObjectActiveInActiveScene(actor)) continue;
      if (getActorComponent(actor, FlyingComponent)) continue;
      if (!getActorComponent(actor, ActorTranslateComponent)) continue;
      if (!getActorComponent(actor, RepresentableComponent)) continue;
      if (getActorComponent(actor, HealthComponent)?.killed) continue;

      const id = getActorComponent(actor, IdComponent)?.id;
      if (!id || id === actorId) continue;

      const heightLayer = this.getActorHeightLayer(actor);
      const actorKeys = getTileCoordsUnderObject(tilemap, actor).map((tile) => this.toKey(tile, heightLayer));
      if (actorKeys.some((key) => keySet.has(key))) {
        blockers.add(id);
      }
    }
  }

  private getActorHeightLayer(actor: Phaser.GameObjects.GameObject): number {
    const z = getActorComponent(actor, RepresentableComponent)?.logicalWorldTransform.z ?? 0;
    return Math.round(z);
  }

  private toKey(tile: Vector2Simple, heightLayer: number): string {
    return `${tile.x},${tile.y},${Math.round(heightLayer)}`;
  }

  private destroy(): void {
    this.stepReservations.clear();
    this.destinationReservations.clear();
  }
}
