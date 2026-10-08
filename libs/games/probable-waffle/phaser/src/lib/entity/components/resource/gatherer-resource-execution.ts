import type Phaser from "phaser";
import type { GatherData } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/resource/gather-data";
import { ResourceSourceComponent } from "./resource-source-component";
import { ResourceDrainComponent } from "./resource-drain-component";
import { getActorComponent } from "../../../data/actor-component";
import { OwnerComponent } from "../owner-component";
import { emitResource, getPlayer } from "../../../data/scene-data";
import { HealthComponent } from "../combat/components/health-component";
import type { GathererComponent } from "./gatherer-component";
type GameObject = Phaser.GameObjects.GameObject;

/** Runs native gathering/drop-off with the facade's state and original callback/await ordering. */
export class GathererResourceExecution {
  private static readonly debug = false;
  constructor(private readonly gameObject: GameObject, private readonly gatherer: GathererComponent,
    private readonly gatherData: (source: GameObject) => GatherData | null,
    private readonly callbacks: { setCarriedResourceAmount: (amount: number) => void; playGatherSound: () => void;
      playGatherAnimation: () => void; leaveCurrentResourceSource: () => void }) {}
  async gatherResources(resourceSource: GameObject): Promise<number> {
    if (this.gatherer.remainingCooldown > 0) return 0;
    if (!this.gatherer.carriedResourceType) {
      // Gatherer is not carrying any resources
      return 0;
    }

    // check resource type
    const gatherData = this.gatherData(resourceSource);
    if (!gatherData) return 0;

    // Check again if we can gather (resource source might have changed)
    const resourceSourceComponent = getActorComponent(resourceSource, ResourceSourceComponent);
    if (!resourceSourceComponent) {
      return 0;
    }
    if (!resourceSourceComponent.canAcceptGatherer() && resourceSource !== this.gatherer.currentResourceSource) {
      return 0;
    }

    // determine amount to gather
    let amountToGather = gatherData.amountPerGathering;
    if (this.gatherer.carriedResourceAmount + amountToGather > gatherData.capacity) {
      amountToGather = gatherData.capacity - this.gatherer.carriedResourceAmount;
    }

    // gather resources
    const gatheredAmount = await resourceSourceComponent.extractResources(this.gameObject, amountToGather);
    if (getActorComponent(this.gameObject, HealthComponent)?.killed) {
      // actor died while gathering
      return 0;
    }
    this.callbacks.setCarriedResourceAmount(this.gatherer.carriedResourceAmount + gatheredAmount);

    this.callbacks.playGatherSound();
    if (this.gatherer.actorTranslateComponent) this.gatherer.actorTranslateComponent.turnTowardsGameObject(resourceSource);
    this.callbacks.playGatherAnimation();

    // start cooldown timer
    this.gatherer.remainingCooldown = gatherData.cooldown;
    this.gatherer.cooldownStartedTick = this.gatherer.simulationTickService?.currentTick ?? null;

    if (GathererResourceExecution.debug) {
      console.log(`Gathered ${gatheredAmount} ${gatherData.resourceType} from ${resourceSource.name}`);
    }

    this.gatherer.onResourceGathered.next([this.gameObject, resourceSource, gatherData, gatheredAmount]);

    // Allow the resource source definition to override the gatherer's default needsReturnToDrain
    const needsReturnToDrain =
      resourceSourceComponent.resourceSourceDefinition.needsReturnToDrain ?? gatherData.needsReturnToDrain;

    if (needsReturnToDrain) {
      // check if we're at capacity
      if (this.gatherer.carriedResourceAmount >= gatherData.capacity) {
        this.callbacks.leaveCurrentResourceSource();
      }
    } else {
      // check if we're at capacity or the resource source is empty
      if (this.gatherer.carriedResourceAmount >= gatherData.capacity || resourceSourceComponent.getCurrentResources() === 0) {
        // return immediately
        const owner = getActorComponent(resourceSource, OwnerComponent)?.getOwner();
        if (!owner) throw new Error("Owner not found");
        const player = getPlayer(this.gameObject.scene, owner);
        if (player) {
          const carriedResourceType = this.gatherer.carriedResourceType;

          const carriedAmount = this.gatherer.carriedResourceAmount;
          if (carriedAmount > 0) {
            emitResource(this.gameObject.scene, "resource.added", { [carriedResourceType]: carriedAmount }, owner);
            this.callbacks.setCarriedResourceAmount(0);

            if (GathererResourceExecution.debug) {
              console.log(`Returned ${carriedAmount} ${carriedResourceType} to ${this.gameObject.name}`);
            }
            this.gatherer.onResourcesReturned.next([this.gameObject, carriedResourceType, carriedAmount]);
          }
        }
      }

      // stop gathering
      this.callbacks.leaveCurrentResourceSource();
    }
    return gatheredAmount;
  }

  async returnResources(resourceDrain: GameObject): Promise<number> {
    if (!this.gatherer.carriedResourceType) {
      // Gatherer is not carrying any resources
      return 0;
    }
    // return resources
    const resourceDrainComponent = getActorComponent(resourceDrain, ResourceDrainComponent);
    if (!resourceDrainComponent) return 0;
    const returnedResources = await resourceDrainComponent.returnResources(
      this.gameObject,
      this.gatherer.carriedResourceType,
      this.gatherer.carriedResourceAmount
    );
    this.callbacks.setCarriedResourceAmount(this.gatherer.carriedResourceAmount - returnedResources);

    if (GathererResourceExecution.debug) {
      console.log(`Returned ${returnedResources} ${this.gatherer.carriedResourceType} to ${resourceDrain.name}`);
    }
    // notify listeners
    this.gatherer.onResourcesReturned.next([this.gameObject, this.gatherer.carriedResourceType, returnedResources]);
    return returnedResources;
  }

}
