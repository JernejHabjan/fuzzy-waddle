import type Phaser from "phaser";
import type { GatherData } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/resource/gather-data";
import { ResourceSourceComponent } from "./resource-source-component";
import { ResourceDrainComponent } from "./resource-drain-component";
import { getActorComponent } from "../../../data/actor-component";
import { OwnerComponent } from "../owner-component";
import { getPlayer } from "../../../data/scene-data";
import { creditGatheredResource } from "./credit-gathered-resource";
import { HealthComponent } from "../combat/components/health-component";
import type { GathererComponent } from "./gatherer-component";
import type { ResourceCargoChange } from "./resource-cargo-change";
import { ResourceServiceObservation } from "./resource-service-observation";
import { observeResourceCredit } from "./observe-resource-credit";

/** Runs native gathering/drop-off with the facade's state and original callback/await ordering. */
export class GathererResourceExecution {
  private static readonly debug = false;
  private returnInFlight = false;
  private gatherInFlight = false;

  /** Zero cargo can still have a native extraction in progress; preserve that owner until it settles. */
  get inFlight(): boolean {
    return this.gatherInFlight || this.returnInFlight;
  }
  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private readonly gatherer: GathererComponent,
    private readonly gatherData: (source: Phaser.GameObjects.GameObject) => GatherData | null,
    private readonly callbacks: {
      setCarriedResourceAmount: (amount: number, change?: ResourceCargoChange) => void;
      playGatherSound: () => void;
      playGatherAnimation: () => void;
      leaveCurrentResourceSource: () => void;
    }
  ) {}
  async gatherResources(resourceSource: Phaser.GameObjects.GameObject, execution?: object): Promise<number> {
    if (this.inFlight) return 0;
    this.gatherInFlight = true;
    try {
      return await this.gatherOnce(resourceSource, execution);
    } finally {
      this.gatherInFlight = false;
    }
  }

  private async gatherOnce(resourceSource: Phaser.GameObjects.GameObject, execution?: object): Promise<number> {
    ResourceServiceObservation.begin(
      this.gameObject,
      this.gatherer,
      resourceSource,
      () => ({ amount: this.gatherer.carriedResourceAmount, resourceType: this.gatherer.carriedResourceType }),
      execution
    );
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

    // A finite source can be destroyed by extraction; retain its ownership component across that native await.
    const sourceOwner = getActorComponent(resourceSource, OwnerComponent);
    const gathererOwner = getActorComponent(this.gameObject, OwnerComponent);
    // gather resources
    const gatheredAmount = await resourceSourceComponent.extractResources(this.gameObject, amountToGather);
    if (getActorComponent(this.gameObject, HealthComponent)?.killed) {
      // actor died while gathering
      return 0;
    }
    this.callbacks.setCarriedResourceAmount(this.gatherer.carriedResourceAmount + gatheredAmount, {
      reason: "added",
      execution,
      target: resourceSource,
      resourceType: gatherData.resourceType,
      delta: gatheredAmount
    });

    this.callbacks.playGatherSound();
    if (this.gatherer.actorTranslateComponent)
      this.gatherer.actorTranslateComponent.turnTowardsGameObject(resourceSource);
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
      if (
        this.gatherer.carriedResourceAmount >= gatherData.capacity ||
        resourceSourceComponent.getCurrentResources() === 0
      ) {
        // return immediately
        const owner = sourceOwner?.getOwner() ?? gathererOwner?.getOwner();
        if (!owner) throw new Error("Owner not found");
        const player = getPlayer(this.gameObject.scene, owner);
        if (player) {
          const carriedResourceType = this.gatherer.carriedResourceType;

          const carriedAmount = this.gatherer.carriedResourceAmount;
          if (carriedAmount > 0) {
            const context = ResourceServiceObservation.offer(
              this.gameObject,
              this.gatherer,
              resourceSource,
              () => ({ amount: carriedAmount, resourceType: carriedResourceType }),
              execution
            );
            const amounts = { [carriedResourceType]: carriedAmount };
            observeResourceCredit(
              {
                actor: this.gameObject,
                target: resourceSource,
                context,
                resourceType: carriedResourceType,
                amount: carriedAmount,
                channel: "immediate",
                ownerArgument: owner
              },
              this.gameObject.scene,
              amounts,
              () => creditGatheredResource(this.gameObject.scene, owner, carriedResourceType, amounts)
            );
            this.callbacks.setCarriedResourceAmount(0, {
              reason: "removed",
              execution,
              transfer: context?.transfer,
              target: resourceSource,
              resourceType: carriedResourceType,
              delta: carriedAmount
            });

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

  async returnResources(resourceDrain: Phaser.GameObjects.GameObject, execution?: object): Promise<number> {
    // A cancelled/replaced pawn order can start another return while this drain still awaits its cooldown.
    // Keep one transfer per carrier so the same offered pile cannot be credited and debited twice.
    if (this.inFlight) {
      ResourceServiceObservation.begin(
        this.gameObject,
        this.gatherer,
        resourceDrain,
        () => ({ amount: this.gatherer.carriedResourceAmount, resourceType: this.gatherer.carriedResourceType }),
        execution
      );
      return 0;
    }
    this.returnInFlight = true;
    try {
      const resourceType = this.gatherer.carriedResourceType;
      ResourceServiceObservation.begin(
        this.gameObject,
        this.gatherer,
        resourceDrain,
        () => ({ amount: this.gatherer.carriedResourceAmount, resourceType: resourceType }),
        execution
      );
      if (!resourceType) {
        // Gatherer is not carrying any resources
        return 0;
      }
      // return resources
      const resourceDrainComponent = getActorComponent(resourceDrain, ResourceDrainComponent);
      if (!resourceDrainComponent) return 0;
      const context = ResourceServiceObservation.offer(
        this.gameObject,
        this.gatherer,
        resourceDrain,
        () => ({ amount: this.gatherer.carriedResourceAmount, resourceType: resourceType }),
        execution
      );
      const returnedResources = await (context
        ? resourceDrainComponent.returnResources(
            this.gameObject,
            resourceType,
            this.gatherer.carriedResourceAmount,
            context
          )
        : resourceDrainComponent.returnResources(this.gameObject, resourceType, this.gatherer.carriedResourceAmount));
      this.callbacks.setCarriedResourceAmount(this.gatherer.carriedResourceAmount - returnedResources, {
        reason: "removed",
        execution,
        transfer: context?.transfer,
        target: resourceDrain,
        resourceType: resourceType,
        delta: returnedResources
      });

      if (GathererResourceExecution.debug) {
        console.log(`Returned ${returnedResources} ${resourceType} to ${resourceDrain.name}`);
      }
      // notify listeners
      this.gatherer.onResourcesReturned.next([this.gameObject, resourceType, returnedResources]);
      return returnedResources;
    } finally {
      this.returnInFlight = false;
    }
  }
}
