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

export interface MovementOccupancyDebugEntry {
  actorId: ActorId;
  tiles: Vector2Simple[];
  heightLayer: number;
  source: "current" | "step" | "destination";
}

export interface MovementDynamicBlocker {
  tile: Vector2Simple;
  heightLayer: number;
}

export interface MovementReservationResult {
  reserved: boolean;
  blockers: ActorId[];
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
    return this.reserve(actorId, footprint, heightLayer, this.stepReservations).reserved;
  }

  tryReserveStep(actorId: ActorId, footprint: Vector2Simple[], heightLayer: number): MovementReservationResult {
    return this.reserve(actorId, footprint, heightLayer, this.stepReservations);
  }

  reserveDestination(actorId: ActorId, footprint: Vector2Simple[], heightLayer: number): boolean {
    return this.reserve(actorId, footprint, heightLayer, this.destinationReservations).reserved;
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

  getDynamicBlockedTilesForActor(actorId: ActorId, heightLayer: number): Vector2Simple[] {
    return this.getDynamicBlockersForActor(actorId)
      .filter((blocker) => blocker.heightLayer === Math.round(heightLayer))
      .map((blocker) => blocker.tile);
  }

  getDynamicBlockersForActor(actorId: ActorId): MovementDynamicBlocker[] {
    const blockedKeys = new Set<string>();
    for (const entry of this.getDebugSnapshot()) {
      if (entry.actorId === actorId) continue;
      for (const tile of entry.tiles) {
        blockedKeys.add(`${tile.x},${tile.y},${entry.heightLayer}`);
      }
    }
    return Array.from(blockedKeys)
      .map((key) => {
        const [x, y, heightLayer] = key.split(",").map(Number);
        return { tile: { x: x!, y: y! }, heightLayer: Math.round(heightLayer!) };
      })
      .sort((a, b) => {
        if (a.heightLayer !== b.heightLayer) return a.heightLayer - b.heightLayer;
        if (a.tile.y !== b.tile.y) return a.tile.y - b.tile.y;
        return a.tile.x - b.tile.x;
      });
  }

  getDebugSnapshot(): MovementOccupancyDebugEntry[] {
    const entries: MovementOccupancyDebugEntry[] = [];
    entries.push(...this.getCurrentOccupancyDebugEntries());
    entries.push(...this.getReservationDebugEntries(this.stepReservations, "step"));
    entries.push(...this.getReservationDebugEntries(this.destinationReservations, "destination"));
    return entries.sort((a, b) => {
      if (a.heightLayer !== b.heightLayer) return a.heightLayer - b.heightLayer;
      if (a.actorId !== b.actorId) return a.actorId.localeCompare(b.actorId);
      return a.source.localeCompare(b.source);
    });
  }

  hasActiveStepReservation(actorId: ActorId): boolean {
    return this.stepReservations.has(actorId);
  }

  hasAnyActiveStepReservation(actorIds: ActorId[]): boolean {
    return actorIds.some((actorId) => this.hasActiveStepReservation(actorId));
  }

  private reserve(
    actorId: ActorId,
    footprint: Vector2Simple[],
    heightLayer: number,
    reservations: Map<ActorId, Reservation>
  ): MovementReservationResult {
    const keys = footprint.map((tile) => this.toKey(tile, heightLayer));
    const blockers = this.getBlockingActors(actorId, footprint, heightLayer);
    if (blockers.length > 0) {
      return { reserved: false, blockers };
    }
    reservations.set(actorId, { actorId, keys });
    return { reserved: true, blockers: [] };
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

  private getCurrentOccupancyDebugEntries(): MovementOccupancyDebugEntry[] {
    const tilemap = getSceneComponent(this.scene, TilemapComponent)?.tilemap;
    const actorIndex = getSceneService(this.scene, ActorIndexSystem);
    if (!tilemap || !actorIndex) return [];

    const entries: MovementOccupancyDebugEntry[] = [];
    for (const actor of actorIndex.getAllIdActors()) {
      if (!isGameObjectActiveInActiveScene(actor)) continue;
      if (getActorComponent(actor, FlyingComponent)) continue;
      if (!getActorComponent(actor, ActorTranslateComponent)) continue;
      if (!getActorComponent(actor, RepresentableComponent)) continue;
      if (getActorComponent(actor, HealthComponent)?.killed) continue;

      const actorId = getActorComponent(actor, IdComponent)?.id;
      if (!actorId) continue;
      entries.push({
        actorId,
        tiles: getTileCoordsUnderObject(tilemap, actor).sort((a, b) => (a.y !== b.y ? a.y - b.y : a.x - b.x)),
        heightLayer: this.getActorHeightLayer(actor),
        source: "current"
      });
    }
    return entries;
  }

  private getReservationDebugEntries(
    reservations: Map<ActorId, Reservation>,
    source: "step" | "destination"
  ): MovementOccupancyDebugEntry[] {
    return Array.from(reservations.values()).map((reservation) => {
      const parsed = reservation.keys.map((key) => {
        const [x, y, z] = key.split(",").map(Number);
        return { tile: { x: x!, y: y! }, heightLayer: z! };
      });
      return {
        actorId: reservation.actorId,
        tiles: parsed.map((entry) => entry.tile).sort((a, b) => (a.y !== b.y ? a.y - b.y : a.x - b.x)),
        heightLayer: parsed[0]?.heightLayer ?? 0,
        source
      };
    });
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
