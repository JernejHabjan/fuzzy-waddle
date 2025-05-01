import { GatherData } from "../../economy/gather-data";
import { ResourceSourceComponent } from "../../economy/resource/resource-source-component";
import { GameplayLibrary } from "../../../library/gameplay-library";
import { Subject } from "rxjs";
import { ContainerComponent } from "../../building/container-component";
import { ResourceDrainComponent } from "../../economy/resource/resource-drain-component";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { getActorComponent } from "../../../data/actor-component";
import { OwnerComponent } from "./owner-component";
import { ConstructionSiteComponent } from "../../building/construction/construction-site-component";
import { emitResource, getPlayer } from "../../../data/scene-data";
import { HealthComponent } from "../../combat/components/health-component";
import { onSceneInitialized } from "../../../data/game-object-helper";
import { getSceneService } from "../../../scenes/components/scene-component-helpers";
import { AudioService } from "../../../scenes/services/audio.service";
import {
  SharedActorActionsSfxChoppingSounds,
  SharedActorActionsSfxMiningSounds
} from "../../../sfx/SharedActorActionsSfx";
import { SoundDefinition } from "./audio-actor-component";
import { AnimationActorComponent, AnimationType } from "./animation-actor-component";
import { OrderType } from "../../character/ai/order-type";
import GameObject = Phaser.GameObjects.GameObject;

export type GathererDefinition = {
  // types of gameObjects the gatherer can gather resourcesFrom
  resourceSourceGameObjectClasses: string[];
  // radius in which gameObject will automatically gather resourcesFrom
  resourceSweepRadius: number;
};

export class GathererComponent {
  private static readonly debug = false;
  // when cooldown has expired
  // onCooldownReady: EventEmitter<GameObject> = new EventEmitter<GameObject>();
  private readonly gatheredResources: GatherData[] = [
    {
      capacity: 3,
      cooldown: 1000,
      range: 1,
      resourceType: ResourceType.Wood,
      amountPerGathering: 1,
      needsReturnToDrain: true
    },
    {
      capacity: 3,
      cooldown: 1000,
      range: 1,
      resourceType: ResourceType.Stone,
      amountPerGathering: 1,
      needsReturnToDrain: true
    },
    {
      capacity: 3,
      cooldown: 1000,
      range: 1,
      resourceType: ResourceType.Minerals,
      amountPerGathering: 1,
      needsReturnToDrain: true
    },
    {
      capacity: 3,
      cooldown: 1000,
      range: 1,
      resourceType: ResourceType.Ambrosia,
      amountPerGathering: 1,
      needsReturnToDrain: true
    }
  ];
  // amount the gameObject is carrying
  carriedResourceAmount = 0;
  carriedResourceType: ResourceType | null = null;
  currentResourceSource: GameObject | null = null;
  previousResourceSource: GameObject | null = null;
  previousResourceType: ResourceType | null = null;
  remainingCooldown = 0;

  onResourceGathered: Subject<[GameObject, GameObject, GatherData, number]> = new Subject<
    [GameObject, GameObject, GatherData, number]
  >();
  onResourcesReturned: Subject<[GameObject, ResourceType, number]> = new Subject<[GameObject, ResourceType, number]>();
  private audioService?: AudioService;
  private animationActorComponent?: AnimationActorComponent;

  constructor(
    private readonly gameObject: GameObject,
    private readonly gathererComponentDefinition: GathererDefinition
  ) {
    gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
    onSceneInitialized(this.gameObject.scene, this.sceneInit, this);
  }

  private sceneInit() {
    this.audioService = getSceneService(this.gameObject.scene, AudioService);
    this.animationActorComponent = getActorComponent(this.gameObject, AnimationActorComponent);
  }

  private update(_: number, delta: number): void {
    if (this.remainingCooldown <= 0) {
      return;
    }
    this.remainingCooldown -= delta;
    this.remainingCooldown = Math.max(this.remainingCooldown, 0);
    // if (this.remainingCooldown <= 0) {
    //   this.onCooldownReady.emit(this.gameObject);
    // }
  }

  private destroy() {
    this.gameObject.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
  }

  canGatherFrom(gameObject: GameObject): boolean {
    // get resourceSourceComponent from gameObject
    const resourceSourceComponent = getActorComponent(gameObject, ResourceSourceComponent);
    if (!resourceSourceComponent) {
      return false;
    }
    // if not full or not correct tool
    if (this.carriedResourceAmount >= resourceSourceComponent.getMaximumResources()) {
      return false;
    }
    // todo

    return true;
  }

  /**
   * this gets set by the behavior tree
   */
  startGatheringResources(resourceSource: GameObject): boolean {
    if (this.currentResourceSource === resourceSource) return true;

    if (!this.canGatherFrom(resourceSource)) return false;

    this.currentResourceSource = resourceSource;

    const resourceSourceComponent = getActorComponent(resourceSource, ResourceSourceComponent);
    if (!resourceSourceComponent) return false;

    const gatherData = this.getGatherDataForResourceSource(resourceSource);

    if (!gatherData) return false;

    // reset carried amount
    this.setCarriedResourceAmount(0);
    this.carriedResourceType = resourceSourceComponent.getResourceType();

    if (resourceSourceComponent.mustGathererEnter()) {
      // enter resource source
      const containerComponent = getActorComponent(resourceSource, ContainerComponent);
      if (containerComponent) {
        containerComponent.loadGameObject(this.gameObject);
      }
    }
    return true;
  }

  findClosestResourceDrain(): GameObject | null {
    if (this.carriedResourceType === null) {
      // Gatherer is not carrying any resources
      return null;
    }

    // find nearby gameObjects
    let closestResourceDrain: GameObject | null = null;
    let closestResourceDrainDistance = 0;

    const gatherer = this.gameObject;
    const gatherOwnerComponent = getActorComponent(gatherer, OwnerComponent);

    const gameObjects = this.gameObject.scene.children.list as GameObject[]; // todo this is expensive
    for (const resourceDrain of gameObjects) {
      // check if found resource drain
      const resourceDrainComponent = getActorComponent(resourceDrain, ResourceDrainComponent);
      if (!resourceDrainComponent) continue;

      // check owner
      if (!gatherOwnerComponent || !gatherOwnerComponent.isSameTeamAsGameObject(resourceDrain)) continue;

      // check resource type
      if (!resourceDrainComponent.getResourceTypes().includes(this.carriedResourceType)) continue;

      // check if ready to use - e.g. building finished
      if (!GathererComponent.isReadyToUse(resourceDrain)) continue;

      // check distance
      // todo here we may need to check navigatable path?
      const distance = GameplayLibrary.getTileDistanceBetweenGameObjects(gatherer, resourceDrain);
      if (distance && (!closestResourceDrain || distance < closestResourceDrainDistance)) {
        closestResourceDrain = resourceDrain;
        closestResourceDrainDistance = distance;
      }
    }

    return closestResourceDrain;
  }

  /**
   * Checks whether the specified actor is ready to use (e.g. finished building).
   */
  private static isReadyToUse(resourceDrain: GameObject): boolean {
    const constructionSiteComponent = getActorComponent(resourceDrain, ConstructionSiteComponent);
    if (!constructionSiteComponent) return true;
    return constructionSiteComponent.isFinished;
  }

  // Gets the resource source the gameObject has recently been gathering from, if available, or a similar one within its sweep radius
  getPreferredResourceSource(): GameObject | undefined {
    if (this.previousResourceSource) {
      return this.previousResourceSource;
    }
    return this.getClosestResourceSource(
      this.previousResourceType,
      this.gathererComponentDefinition.resourceSweepRadius
    );
  }

  getNewResourceSource(): GameObject | undefined {
    this.previousResourceSource = null;
    return this.getPreferredResourceSource();
  }

  getClosestResourceSource(resourceType: ResourceType | null, maxDistance: number): GameObject | undefined {
    let closestResourceSource: GameObject | undefined = undefined;
    let closestResourceSourceDistance = 0;

    // todo get all gameObjects in the world and check the closest
    const gameObjects = this.gameObject.scene.children.list as GameObject[]; // todo this is expensive
    for (const gameObject of gameObjects) {
      // get resourceSourceComponent
      const resourceSourceComponent = getActorComponent(gameObject, ResourceSourceComponent);
      if (!resourceSourceComponent) continue;
      // if not correct resource type
      if (resourceType && resourceSourceComponent.getResourceType() !== resourceType) continue;
      // check amount of resources
      if (resourceSourceComponent.getCurrentResources() <= 0) continue;
      // check distance
      const distance = GameplayLibrary.getTileDistanceBetweenGameObjects(this.gameObject, gameObject); // todo here we may need to check navigatable path?
      if (distance === null) continue;
      if (maxDistance > 0 && distance > maxDistance) continue;
      if (!closestResourceSource || distance < closestResourceSourceDistance) {
        closestResourceSource = gameObject;
        closestResourceSourceDistance = distance;
      }
    }
    return closestResourceSource;
  }

  getPreferredResourceDrain(): GameObject | null {
    return this.findClosestResourceDrain();
  }

  isCarryingResources(): boolean {
    return !!this.carriedResourceAmount;
  }

  get isGathering(): boolean {
    return !!this.currentResourceSource;
  }

  async gatherResources(resourceSource: GameObject): Promise<number> {
    if (this.remainingCooldown > 0) return 0;
    if (!this.carriedResourceType) {
      // Gatherer is not carrying any resources
      return 0;
    }

    // check resource type
    const gatherData = this.getGatherDataForResourceSource(resourceSource);
    if (!gatherData) return 0;

    // determine amount to gather
    let amountToGather = gatherData.amountPerGathering;
    if (this.carriedResourceAmount + amountToGather > gatherData.capacity) {
      amountToGather = gatherData.capacity - this.carriedResourceAmount;
    }

    // gather resources
    const resourceSourceComponent = getActorComponent(resourceSource, ResourceSourceComponent);
    if (!resourceSourceComponent) {
      return 0;
    }
    const gatheredAmount = await resourceSourceComponent.extractResources(this.gameObject, amountToGather);
    this.setCarriedResourceAmount(this.carriedResourceAmount + gatheredAmount);

    this.playGatherSound();
    this.playGatherAnimation();

    // start cooldown timer
    this.remainingCooldown = gatherData.cooldown;

    if (GathererComponent.debug) {
      console.log(`Gathered ${gatheredAmount} ${gatherData.resourceType} from ${resourceSource.name}`);
    }

    this.onResourceGathered.next([this.gameObject, resourceSource, gatherData, gatheredAmount]);

    if (gatherData.needsReturnToDrain) {
      // check if we're at capacity
      if (this.carriedResourceAmount >= gatherData.capacity) {
        this.leaveCurrentResourceSource();
      }
    } else {
      // check if we're at capacity or the resource source is empty
      if (this.carriedResourceAmount >= gatherData.capacity || resourceSourceComponent.getCurrentResources() === 0) {
        // return immediately
        const owner = getActorComponent(resourceSource, OwnerComponent)?.getOwner();
        if (!owner) throw new Error("Owner not found");
        const player = getPlayer(this.gameObject.scene, owner);
        if (player) {
          const carriedResourceType = this.carriedResourceType;

          const carriedAmount = this.carriedResourceAmount;
          if (carriedAmount > 0) {
            emitResource(this.gameObject.scene, "resource.added", { [carriedResourceType]: carriedAmount });
            this.setCarriedResourceAmount(0);

            if (GathererComponent.debug) {
              console.log(`Returned ${carriedAmount} ${carriedResourceType} to ${this.gameObject.name}`);
            }
            this.onResourcesReturned.next([this.gameObject, carriedResourceType, carriedAmount]);
          }
        }
      }

      // stop gathering
      this.leaveCurrentResourceSource();
    }
    return gatheredAmount;
  }

  async returnResources(resourceDrain: GameObject): Promise<number> {
    if (!this.carriedResourceType) {
      // Gatherer is not carrying any resources
      return 0;
    }
    // return resources
    const resourceDrainComponent = getActorComponent(resourceDrain, ResourceDrainComponent);
    if (!resourceDrainComponent) return 0;
    const returnedResources = await resourceDrainComponent.returnResources(
      this.gameObject,
      this.carriedResourceType,
      this.carriedResourceAmount
    );
    this.setCarriedResourceAmount(this.carriedResourceAmount - returnedResources);

    if (GathererComponent.debug) {
      console.log(`Returned ${returnedResources} ${this.carriedResourceType} to ${resourceDrain.name}`);
    }
    // notify listeners
    this.onResourcesReturned.next([this.gameObject, this.carriedResourceType, returnedResources]);
    return returnedResources;
  }

  isCapacityFull() {
    if (!this.carriedResourceType) return false;

    const gatherData = this.getGatherDataForResourceType(this.carriedResourceType);
    if (!gatherData) return false;

    return this.carriedResourceAmount >= gatherData.capacity;
  }

  getGatherRange(resourceSource: GameObject): number {
    const gatherData = this.getGatherDataForResourceSource(resourceSource);

    if (!gatherData) {
      return 0;
    }
    return gatherData.range;
  }

  private getGatherDataForResourceType(carriedResourceType: ResourceType): GatherData | null {
    return this.gatheredResources.find((gatherData) => gatherData.resourceType === carriedResourceType) ?? null;
  }

  private getGatherDataForResourceSource(resourceSource: GameObject): GatherData | null {
    const resourceSourceComponent = getActorComponent(resourceSource, ResourceSourceComponent);
    if (!resourceSourceComponent) return null;

    return this.getGatherDataForResourceType(resourceSourceComponent.getResourceType());
  }

  private setCarriedResourceAmount(amount: number) {
    this.carriedResourceAmount = amount;
    if (amount <= 0) {
      this.carriedResourceType = null;
    }
  }

  private leaveCurrentResourceSource() {
    if (!this.currentResourceSource) return;
    const containerComponent = getActorComponent(this.currentResourceSource, ContainerComponent);
    if (containerComponent) {
      containerComponent.unloadGameObject(this.gameObject);
    }

    // store data about resource source for future reference (e.g. return here, or find similar)
    this.previousResourceSource = this.currentResourceSource;
    this.previousResourceType = this.carriedResourceType;
    this.currentResourceSource = null;
  }

  private playGatherSound() {
    if (!this.audioService) return;
    const resourceType = this.carriedResourceType;
    if (!resourceType) return;
    let sounds: SoundDefinition[] = [];
    switch (resourceType) {
      case ResourceType.Ambrosia:
        break;
      case ResourceType.Wood:
        sounds = SharedActorActionsSfxChoppingSounds;
        break;
      case ResourceType.Stone:
      case ResourceType.Minerals:
        sounds = SharedActorActionsSfxMiningSounds;
        break;
    }

    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    this.audioService.playSpatialAudioSprite(this.gameObject, randomSound.key, randomSound.spriteName);
  }

  private playGatherAnimation() {
    if (!this.animationActorComponent) return;
    const resourceType = this.carriedResourceType;
    if (!resourceType) return;
    this.animationActorComponent.playOrderAnimation(OrderType.Gather);
  }

  getGatherAnimation(): AnimationType | null {
    if (!this.animationActorComponent) return null;
    const resourceType = this.carriedResourceType;
    if (!resourceType) return null;
    switch (resourceType) {
      case ResourceType.Ambrosia:
        return AnimationType.Mine;
      case ResourceType.Wood:
        return AnimationType.Chop;
      case ResourceType.Stone:
        return AnimationType.Mine;
      case ResourceType.Minerals:
        return AnimationType.Mine;
    }
  }
}
