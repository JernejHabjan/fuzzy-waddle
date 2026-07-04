import { GatherData } from "./gather-data";
import { ResourceSourceComponent } from "./resource-source-component";
import { DistanceHelper } from "../../../library/distance-helper";
import { Subject, type Subscription } from "rxjs";
import { ContainerComponent } from "../building/container-component";
import { ResourceDrainComponent } from "./resource-drain-component";
import { type GathererComponentData, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { getActorComponent } from "../../../data/actor-component";
import { OwnerComponent } from "../owner-component";
import { ConstructionSiteComponent } from "../construction/construction-site-component";
import { emitResource, getPlayer } from "../../../data/scene-data";
import { HealthComponent } from "../combat/components/health-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { AudioService } from "../../../world/services/audio.service";
import {
  SharedActorActionsSfxChoppingSounds,
  SharedActorActionsSfxMiningSounds
} from "../../../sfx/shared-actor-actions-sfx";
import { AnimationActorComponent } from "../animation/animation-actor-component";
import { OrderType } from "../../../ai/order-type";
import { ActorTranslateComponent } from "../movement/actor-translate-component";
import { getGameObjectLogicalTransform, getGameObjectVisibility, onObjectReady } from "../../../data/game-object-helper";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { AnimationType } from "../animation/animation-type";
import { SoundType } from "../actor-audio/sound-type";
import { isCropResourceSource } from "../tendable/growth-stage.interface";
import type { SoundDefinition } from "../actor-audio/sound-definition";
import type { GathererDefinition } from "./gatherer-definition";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { IdComponent } from "../id-component";
import GameObject = Phaser.GameObjects.GameObject;

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
      capacity: 5,
      cooldown: 2000,
      range: 1,
      resourceType: ResourceType.Food,
      amountPerGathering: 2,
      needsReturnToDrain: false
    }
  ];
  // amount the gameObject is carrying
  carriedResourceAmount = 0;
  carriedResourceType: ResourceType | null = null;
  currentResourceSource: GameObject | null = null;
  previousResourceSource: GameObject | null = null;
  previousResourceType: ResourceType | null = null;
  remainingCooldown = 0;
  private cooldownTickSub?: Subscription;
  private simulationTickService?: SimulationTickService;
  private cooldownStartedTick: number | null = null;

  onResourceGathered: Subject<[GameObject, GameObject, GatherData, number]> = new Subject<
    [GameObject, GameObject, GatherData, number]
  >();
  onResourcesReturned: Subject<[GameObject, ResourceType, number]> = new Subject<[GameObject, ResourceType, number]>();
  private audioService?: AudioService;
  private animationActorComponent?: AnimationActorComponent;
  private actorTranslateComponent?: ActorTranslateComponent;

  constructor(
    private readonly gameObject: GameObject,
    private readonly gathererComponentDefinition: GathererDefinition
  ) {
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
    onObjectReady(this.gameObject, this.onObjectReady, this);
  }

  private onObjectReady() {
    this.audioService = getSceneService(this.gameObject.scene, AudioService);
    this.animationActorComponent = getActorComponent(this.gameObject, AnimationActorComponent);
    this.actorTranslateComponent = getActorComponent(this.gameObject, ActorTranslateComponent);
    this.simulationTickService = getSceneService(this.gameObject.scene, SimulationTickService);
    this.cooldownTickSub = this.simulationTickService?.tick$.subscribe(() => {
      this.onSimulationTick();
    });
  }

  private onSimulationTick(): void {
    if (this.remainingCooldown <= 0) {
      return;
    }
    const currentTick = this.simulationTickService?.currentTick;
    // Guard against subscription-order drift: if cooldown was started this same tick,
    // do not decrement it until the next simulation tick.
    if (currentTick !== undefined && this.cooldownStartedTick === currentTick) {
      return;
    }
    this.remainingCooldown -= SimulationTickService.TICK_INTERVAL_MS;
    this.remainingCooldown = Math.max(this.remainingCooldown, 0);
    if (this.remainingCooldown <= 0) {
      this.cooldownStartedTick = null;
    }
    // if (this.remainingCooldown <= 0) {
    //   this.onCooldownReady.emit(this.gameObject);
    // }
  }

  private destroy() {
    this.cooldownTickSub?.unsubscribe();
    // Unassign from resource source
    if (this.currentResourceSource) {
      const resourceSourceComponent = getActorComponent(this.currentResourceSource, ResourceSourceComponent);
      if (resourceSourceComponent) {
        resourceSourceComponent.unassignGatherer(this.gameObject);
      }
    }
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
    // check if resource source can accept more gatherers
    // noinspection RedundantIfStatementJS
    if (!resourceSourceComponent.canAcceptGatherer()) return false;

    return true;
  }

  /**
   * this gets set by the behavior tree
   */
  startGatheringResources(resourceSource: GameObject): boolean {
    if (this.currentResourceSource === resourceSource) return true;

    // Check again if we can gather from this resource source (including maxGatherers check)
    if (!this.canGatherFrom(resourceSource)) return false;

    // Unassign from previous resource source if switching
    if (this.currentResourceSource) {
      const previousResourceSourceComponent = getActorComponent(this.currentResourceSource, ResourceSourceComponent);
      if (previousResourceSourceComponent) {
        previousResourceSourceComponent.unassignGatherer(this.gameObject);
      }
    }

    this.currentResourceSource = resourceSource;

    const resourceSourceComponent = getActorComponent(resourceSource, ResourceSourceComponent);
    if (!resourceSourceComponent) return false;

    // Assign this gatherer to the new resource source
    resourceSourceComponent.assignGatherer(this.gameObject);

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

  async findClosestResourceDrain(): Promise<GameObject | null> {
    if (this.carriedResourceType === null) {
      // Gatherer is not carrying any resources
      return null;
    }

    const gatherer = this.gameObject;
    const gatherOwnerComponent = getActorComponent(gatherer, OwnerComponent);
    const actorIndex = getSceneService(this.gameObject.scene, ActorIndexSystem);

    // Use indexed drains if available, otherwise nothing
    const drains = actorIndex ? actorIndex.getResourceDrainsFiltered(undefined, this.carriedResourceType) : [];

    const validDrains = drains.filter((resourceDrain) => {
      // check owner / team
      if (!gatherOwnerComponent || !gatherOwnerComponent.isSameTeamAsGameObject(resourceDrain)) return false;

      // check ready to use
      return GathererComponent.isReadyToUse(resourceDrain);
    });

    // Use batch method for better performance
    const pairs: [GameObject, GameObject][] = validDrains.map((drain) => [gatherer, drain]);
    const distances = await DistanceHelper.batchGetDistancesBetweenGameObjects(pairs);

    let closestResourceDrain: GameObject | null = null;
    let closestResourceDrainDistance = Infinity;

    for (let i = 0; i < validDrains.length; i++) {
      const distance = distances[i];
      if (typeof distance !== "number") {
        continue;
      }
      const candidate = validDrains[i]!;
      if (
        distance < closestResourceDrainDistance ||
        (distance === closestResourceDrainDistance &&
          closestResourceDrain !== null &&
          this.compareActorTieBreaker(candidate, closestResourceDrain) < 0)
      ) {
        closestResourceDrain = candidate;
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
  async getPreferredResourceSource(): Promise<GameObject | undefined> {
    if (this.previousResourceSource) {
      return this.previousResourceSource;
    }
    return this.getClosestResourceSource(
      this.previousResourceType,
      this.gathererComponentDefinition.resourceSweepRadius
    );
  }

  async getNewResourceSource(): Promise<GameObject | undefined> {
    this.previousResourceSource = null;
    return this.getPreferredResourceSource();
  }

  async getClosestResourceSource(
    resourceType: ResourceType | null,
    maxDistance: number
  ): Promise<GameObject | undefined> {
    const actorIndex = getSceneService(this.gameObject.scene, ActorIndexSystem);
    const sources = actorIndex ? actorIndex.getResourceSourcesFiltered(resourceType ?? undefined) : [];

    const validSources = sources.filter((gameObject) => {
      const resourceSourceComponent = getActorComponent(gameObject, ResourceSourceComponent);
      if (!resourceSourceComponent) return false;
      // if not correct resource type
      if (resourceType && resourceSourceComponent.getResourceType() !== resourceType) return false;
      // check amount of resources
      if (resourceSourceComponent.getCurrentResources() <= 0) return false;
      // check if resource source can accept more gatherers
      // noinspection RedundantIfStatementJS
      if (!resourceSourceComponent.canAcceptGatherer()) return false;
      return true;
    });

    // Use batch method for better performance
    const pairs: [GameObject, GameObject][] = validSources.map((source) => [this.gameObject, source]);
    const distances = await DistanceHelper.batchGetDistancesBetweenGameObjects(pairs);

    let closestResourceSource: GameObject | undefined = undefined;
    let closestResourceSourceDistance = Infinity;

    for (let i = 0; i < validSources.length; i++) {
      const distance = distances[i];
      if (typeof distance !== "number") continue;
      if (maxDistance > 0 && distance > maxDistance) continue;
      const candidate = validSources[i];
      if (!candidate) {
        continue;
      }
      if (
        distance < closestResourceSourceDistance ||
        (distance === closestResourceSourceDistance &&
          closestResourceSource !== undefined &&
          this.compareActorTieBreaker(candidate, closestResourceSource) < 0)
      ) {
        closestResourceSource = candidate;
        closestResourceSourceDistance = distance;
      }
    }
    return closestResourceSource;
  }

  /**
   * Deterministic tie-break for equal-distance candidates.
   * Without this, Set/list iteration order differences can desync resource target selection.
   */
  private compareActorTieBreaker(left: GameObject, right: GameObject): number {
    const leftId = getActorComponent(left, IdComponent)?.id;
    const rightId = getActorComponent(right, IdComponent)?.id;
    if (leftId && rightId && leftId !== rightId) {
      return leftId.localeCompare(rightId);
    }
    const leftTransform = getGameObjectLogicalTransform(left);
    const rightTransform = getGameObjectLogicalTransform(right);
    const leftKey = `${left.name}:${Math.round(leftTransform?.x ?? 0)}:${Math.round(leftTransform?.y ?? 0)}:${Math.round(leftTransform?.z ?? 0)}`;
    const rightKey = `${right.name}:${Math.round(rightTransform?.x ?? 0)}:${Math.round(rightTransform?.y ?? 0)}:${Math.round(rightTransform?.z ?? 0)}`;
    return leftKey.localeCompare(rightKey);
  }

  async getPreferredResourceDrain(): Promise<GameObject | null> {
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

    // Check again if we can gather (resource source might have changed)
    const resourceSourceComponent = getActorComponent(resourceSource, ResourceSourceComponent);
    if (!resourceSourceComponent) {
      return 0;
    }
    if (!resourceSourceComponent.canAcceptGatherer() && resourceSource !== this.currentResourceSource) {
      return 0;
    }

    // determine amount to gather
    let amountToGather = gatherData.amountPerGathering;
    if (this.carriedResourceAmount + amountToGather > gatherData.capacity) {
      amountToGather = gatherData.capacity - this.carriedResourceAmount;
    }

    // gather resources
    const gatheredAmount = await resourceSourceComponent.extractResources(this.gameObject, amountToGather);
    if (getActorComponent(this.gameObject, HealthComponent)?.killed) {
      // actor died while gathering
      return 0;
    }
    this.setCarriedResourceAmount(this.carriedResourceAmount + gatheredAmount);

    this.playGatherSound();
    if (this.actorTranslateComponent) this.actorTranslateComponent.turnTowardsGameObject(resourceSource);
    this.playGatherAnimation();

    // start cooldown timer
    this.remainingCooldown = gatherData.cooldown;
    this.cooldownStartedTick = this.simulationTickService?.currentTick ?? null;

    if (GathererComponent.debug) {
      console.log(`Gathered ${gatheredAmount} ${gatherData.resourceType} from ${resourceSource.name}`);
    }

    this.onResourceGathered.next([this.gameObject, resourceSource, gatherData, gatheredAmount]);

    // Allow the resource source definition to override the gatherer's default needsReturnToDrain
    const needsReturnToDrain =
      resourceSourceComponent.resourceSourceDefinition.needsReturnToDrain ?? gatherData.needsReturnToDrain;

    if (needsReturnToDrain) {
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
            emitResource(this.gameObject.scene, "resource.added", { [carriedResourceType]: carriedAmount }, owner);
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

    // Unassign from resource source
    const resourceSourceComponent = getActorComponent(this.currentResourceSource, ResourceSourceComponent);
    if (resourceSourceComponent) {
      resourceSourceComponent.unassignGatherer(this.gameObject);
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
      case ResourceType.Wood:
        sounds = SharedActorActionsSfxChoppingSounds;
        break;
      case ResourceType.Stone:
      case ResourceType.Minerals:
        sounds = SharedActorActionsSfxMiningSounds;
        break;
      case ResourceType.Food:
        sounds = SharedActorActionsSfxChoppingSounds;
        break;
    }

    // can be random as it doesn't need to be deterministic
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)]!;
    const visibilityComponent = getGameObjectVisibility(this.gameObject);
    if (visibilityComponent && visibilityComponent.visible) {
      this.audioService.playSpatialAudioSprite(this.gameObject, randomSound.key, randomSound.spriteName);
    }
  }

  private playGatherAnimation() {
    if (!this.animationActorComponent) return;
    const resourceType = this.carriedResourceType;
    if (!resourceType) return;
    this.animationActorComponent.playOrderAnimation(OrderType.Gather);
  }

  getGatherAnimation(): AnimationType | null {
    // If the current resource source hosts crops, use the crop-specific animation
    if (isCropResourceSource(this.currentResourceSource)) {
      const cropAnim = this.currentResourceSource.getActiveCropHarvestAnimation();
      if (cropAnim != null) return cropAnim;
    }
    const resourceType = this.carriedResourceType;
    if (!resourceType) return null;
    switch (resourceType) {
      case ResourceType.Wood:
        return AnimationType.Chop;
      case ResourceType.Stone:
        return AnimationType.Mine;
      case ResourceType.Minerals:
        return AnimationType.Mine;
      case ResourceType.Food:
        return AnimationType.Harvest;
      default:
        return null;
    }
  }

  getGatherSound(): SoundType | null {
    // If the current resource source hosts crops, use the crop-specific sound
    if (isCropResourceSource(this.currentResourceSource)) {
      const cropSound = this.currentResourceSource.getActiveCropHarvestSound();
      if (cropSound != null) return cropSound;
    }
    const resourceType = this.carriedResourceType;
    if (!resourceType) return null;
    switch (resourceType) {
      case ResourceType.Wood:
        return SoundType.Chop;
      case ResourceType.Stone:
        return SoundType.Mine;
      case ResourceType.Minerals:
        return SoundType.Mine;
      case ResourceType.Food:
        return SoundType.Chop;
      default:
        return null;
    }
  }

  setData(data: Partial<GathererComponentData>) {
    if (data.carriedResourceAmount !== undefined) {
      this.carriedResourceAmount = data.carriedResourceAmount;
      if (this.carriedResourceAmount <= 0 && data.carriedResourceType === undefined) {
        this.carriedResourceType = null;
      }
    }
    if (data.carriedResourceType !== undefined) {
      this.carriedResourceType = data.carriedResourceType;
    }
    if (data.remainingCooldown !== undefined) {
      this.remainingCooldown = data.remainingCooldown;
      // Fixes gather cooldown drift by anchoring restored cooldown start to the current simulation tick.
      this.cooldownStartedTick = this.remainingCooldown > 0 ? (this.simulationTickService?.currentTick ?? null) : null;
    }
  }

  getData(): GathererComponentData {
    return {
      carriedResourceAmount: this.carriedResourceAmount,
      carriedResourceType: this.carriedResourceType as any,
      remainingCooldown: this.remainingCooldown
    } satisfies GathererComponentData;
  }
}
