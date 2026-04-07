import GameObject = Phaser.GameObjects.GameObject;
import Phaser from "phaser";
import { HealthComponent } from "../combat/components/health-component";
import { getActorComponent } from "../../../data/actor-component";
import { VisionComponent } from "../vision-component";
import { getGameObjectVisibility, isWaterUnit } from "../../../data/game-object-helper";
import type { ContainerComponentData } from "@fuzzy-waddle/api-interfaces";
import { IdComponent } from "../id-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import type { ContainerDefinition } from "./container-definition";
import { Subject } from "rxjs";
import { ContainableComponent } from "./containable-component";
import { NavigationService } from "../../../world/services/navigation.service";
import { RepresentableComponent } from "../representable-component";
import { ActorTranslateComponent } from "../movement/actor-translate-component";

/**
 * apply to resource source that needs gameObjects to enter to gather
 */
export class ContainerComponent {
  static readonly GameObjectVisibilityChanged = "GameObjectVisibilityChanged";
  private containedGameObjects = new Set<GameObject>();
  /** Units that have issued a boarding request but not yet physically loaded. */
  private pendingBoarders = new Set<GameObject>();
  /** Emits whenever units are loaded or unloaded, so HUD can refresh container display. */
  readonly containerChanged = new Subject<void>();

  constructor(
    private readonly gameObject: GameObject,
    public containerDefinition: ContainerDefinition
  ) {
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.onKilled, this);
  }

  /** Replaces the container definition (e.g. on actor level-up). */
  setContainerDefinition(def: ContainerDefinition): void {
    this.containerDefinition = {
      ...this.containerDefinition,
      ...def
    };
    this.containerChanged.next();
  }

  /** Unit registers intent to board this container (e.g. right-clicked while it's in water). */
  registerBoardingRequest(unit: GameObject): void {
    this.pendingBoarders.add(unit);
    this.containerChanged.next();
  }

  cancelBoardingRequest(unit: GameObject): void {
    this.pendingBoarders.delete(unit);
  }

  hasPendingBoarders(): boolean {
    return this.pendingBoarders.size > 0;
  }

  getPendingBoarders(): GameObject[] {
    return Array.from(this.pendingBoarders);
  }

  getContainedGameObjects(): GameObject[] {
    return Array.from(this.containedGameObjects);
  }

  private destroyActorsInContainer() {
    const navigationService = getSceneService(this.gameObject.scene, NavigationService);
    const tile = navigationService?.getCenterTileCoordUnderObject(this.gameObject);
    const isOnShore = tile ? (navigationService?.isShoreTile(tile) ?? false) : false;
    if (!isOnShore) {
      // Silently destroy all contained actors — they go down with the ship
      this.containedGameObjects.forEach((go) => {
        getActorComponent(go, ContainableComponent)?.clearContainerReference();
        const health = getActorComponent(go, HealthComponent);
        if (health) {
          health.destroyActorSilently();
        } else {
          go.destroy();
        }
      });
      this.containedGameObjects.clear();
      return;
    }
  }

  onKilled() {
    // If this is a water unit sinking at sea, destroy contained actors silently (no animation/sfx)
    if (isWaterUnit(this.gameObject)) {
      this.destroyActorsInContainer();
    }
    this.unloadAll();
  }

  destroy() {
    this.onKilled();
    this.containerChanged.complete();
  }

  unloadAll() {
    this.containedGameObjects.forEach((gameObject) => {
      this.unloadGameObject(gameObject);
    });
  }

  unloadGameObject(gameObject: GameObject) {
    this.containedGameObjects.delete(gameObject);
    this.repositionNearContainer(gameObject);
    this.setGameObjectVisible(gameObject, true);
    // Use clearContainerReference() — not leaveContainer() — to avoid infinite recursion
    getActorComponent(gameObject, ContainableComponent)?.clearContainerReference();
    this.containerChanged.next();
  }

  private repositionNearContainer(gameObject: GameObject) {
    const navigationService = getSceneService(this.gameObject.scene, NavigationService);
    if (!navigationService) return;
    const spawnTile = navigationService.getSpawnPointAroundGameObject(this.gameObject);
    if (!spawnTile) return;
    const worldPos = navigationService.getTileWorldCenter(spawnTile);
    if (!worldPos) return;
    const representable = getActorComponent(gameObject, RepresentableComponent);
    const z = representable?.logicalWorldTransform.z ?? 0;
    const newTransform = { x: worldPos.x, y: worldPos.y, z };
    // Use ActorTranslateComponent so listeners (e.g. OwnerComponent ellipsis) are notified of the position change
    const actorTranslateComponent = getActorComponent(gameObject, ActorTranslateComponent);
    if (actorTranslateComponent) {
      actorTranslateComponent.moveActorToLogicalPosition(newTransform);
    } else if (representable) {
      representable.logicalWorldTransform = newTransform;
    }
  }

  canLoadGameObject(gameObject: GameObject): boolean {
    // check if gameObject is not already in container
    if (this.containedGameObjects.has(gameObject)) {
      return false;
    }
    return this.containedGameObjects.size < this.containerDefinition.capacity;
  }

  loadGameObject(gameObject: GameObject) {
    if (!this.canLoadGameObject(gameObject)) {
      return;
    }
    this.containedGameObjects.add(gameObject);
    this.setGameObjectVisible(gameObject, false);
    this.containerChanged.next();
  }

  setGameObjectVisible(gameObject: GameObject, visible: boolean) {
    const visionComponent = getActorComponent(this.gameObject, VisionComponent);
    if (!visionComponent || !visionComponent.visibilityByCurrentPlayer) visible = false;

    const visibilityComponent = getGameObjectVisibility(gameObject);
    if (visibilityComponent) visibilityComponent.setVisible(visible);
    gameObject.emit(ContainerComponent.GameObjectVisibilityChanged, visible);
  }

  setData(data: Partial<ContainerComponentData>) {
    if (data.containedIds !== undefined) {
      const actorIndex = getSceneService(this.gameObject.scene, ActorIndexSystem);
      const actors = actorIndex?.getActorsByIds(data.containedIds) ?? [];
      this.containedGameObjects.clear();
      actors.forEach((actor) => {
        this.loadGameObject(actor);
      });
    }
  }

  getData(): ContainerComponentData {
    const containedIds: string[] = [];
    this.containedGameObjects.forEach((go) => {
      const id = getActorComponent(go, IdComponent)?.id;
      if (id) containedIds.push(id);
    });
    return {
      containedIds
    } satisfies ContainerComponentData;
  }
}
