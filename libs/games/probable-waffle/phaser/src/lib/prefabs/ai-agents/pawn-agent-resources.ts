import Phaser from "phaser";
import { State } from "mistreevous";
import type { PlayerPawnAiControllerAgent } from "./player-pawn-ai-controller.agent";
import { getActorComponent } from "../../data/actor-component";
import { VisionComponent } from "../../entity/components/vision-component";
import { OrderType } from "../../ai/order-type";
import { PawnAiBlackboard } from "./pawn-ai-blackboard";
import { GathererComponent } from "../../entity/components/resource/gatherer-component";
import { ResourceSourceComponent } from "../../entity/components/resource/resource-source-component";
import { HealthComponent } from "../../entity/components/combat/components/health-component";

/** Owns resource acquisition, gathering and return actions, preserving native target mutation and async boundaries.
 * Actor-local collaborators own no subscriptions, timers or saved state; the controller owns their lifetime.
 */
export class PawnAgentResources {
  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private readonly blackboard: PawnAiBlackboard,
    private readonly agent: Pick<PlayerPawnAiControllerAgent, "SelfIsAlive" | "InRange" | "AcquireNewResourceSource">
  ) {}

  /** Assigns the native lookup result to the current order read after source selection finishes. */
  async AcquireNewResourceSource() {
    const gathererComponent = getActorComponent(this.gameObject, GathererComponent);
    if (!gathererComponent) return State.FAILED;
    let resourceSource = await gathererComponent.getPreferredResourceSource();
    const currentResources = resourceSource?.active
      ? getActorComponent(resourceSource, ResourceSourceComponent)?.getCurrentResources()
      : 0;
    if (!currentResources || currentResources <= 0) {
      resourceSource = await gathererComponent.getNewResourceSource();
    }
    if (!resourceSource) return State.FAILED;
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    currentOrder.data.targetGameObject = resourceSource;
    return State.SUCCEEDED;
  }

  /** Reads the destination order after awaiting the preferred drain, preserving native retargeting. */
  async AcquireNewResourceDrain(): Promise<State> {
    const gathererComponent = getActorComponent(this.gameObject, GathererComponent);
    if (!gathererComponent) return State.FAILED;
    const resourceDrain = await gathererComponent.getPreferredResourceDrain();
    if (!resourceDrain) return State.FAILED;
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    currentOrder.data.targetGameObject = resourceDrain;
    return State.SUCCEEDED;
  }

  /** Retains the entry order across the range probe, then lets the gatherer own work and delivery. */
  async GatherResource(): Promise<State> {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    if (!this.agent.SelfIsAlive()) return State.FAILED;
    const inRange = await this.agent.InRange("gather");
    if (inRange !== State.SUCCEEDED) return State.FAILED;
    const target = currentOrder.data.targetGameObject;
    if (!target) return State.FAILED;
    const targetHealth = getActorComponent(target, HealthComponent);
    if (targetHealth && !targetHealth.alive) return State.FAILED;
    const gathererComponent = getActorComponent(this.gameObject, GathererComponent);
    if (!gathererComponent) return State.FAILED;
    if (gathererComponent.remainingCooldown > 0) return State.FAILED;
    if (gathererComponent.isCapacityFull()) return State.FAILED;
    const resourceSourceComponent = getActorComponent(target, ResourceSourceComponent);
    if (!resourceSourceComponent || resourceSourceComponent.getCurrentResources() <= 0) return State.FAILED;
    const successfullyStarted = gathererComponent.startGatheringResources(target);
    if (!successfullyStarted) return State.FAILED;
    await gathererComponent.gatherResources(target);
    return State.SUCCEEDED;
  }

  async DropOffResources() {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    if (!this.agent.SelfIsAlive()) return State.FAILED;
    const target = currentOrder.data.targetGameObject;
    if (!target) return State.FAILED;
    const gathererComponent = getActorComponent(this.gameObject, GathererComponent);
    if (!gathererComponent) return State.FAILED;
    await gathererComponent.returnResources(target);
    return State.SUCCEEDED;
  }

  /** Starts native reacquisition without awaiting it; the tree immediately receives success. */
  ContinueGathering() {
    this.agent.AcquireNewResourceSource();
    return State.SUCCEEDED;
  }

  /**
   * Check if the target still has resources to gather
   */
  TargetHasResources() {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return false;
    const target = currentOrder.data.targetGameObject;
    if (!target) return false;
    const resourceSourceComponent = getActorComponent(target, ResourceSourceComponent);
    if (!resourceSourceComponent) return false;
    return resourceSourceComponent.getCurrentResources() > 0;
  }

  AnyHighValueResourceVisible() {
    const visionComponent = getActorComponent(this.gameObject, VisionComponent);
    if (!visionComponent) return false;
    return visionComponent.getVisibleHighValueResources() !== null;
  }

  GatherHighValueResource() {
    // Command the agent to gather from a high-value resource
    console.log("Gathering high-value resource.");
    return State.SUCCEEDED;
  }

  HasHarvestComponent() {
    // noinspection UnnecessaryLocalVariableJS
    const hasComponent = !!getActorComponent(this.gameObject, GathererComponent);
    return hasComponent;
  }

  GatherCapacityFull(): boolean {
    const gathererComponent = getActorComponent(this.gameObject, GathererComponent);
    if (!gathererComponent) return false;
    return gathererComponent.isCapacityFull();
  }

  async AssignDropOffResourcesOrder(): Promise<State> {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;

    const gathererComponent = getActorComponent(this.gameObject, GathererComponent);
    if (!gathererComponent) return State.FAILED;

    const preferredResourceDrain = await gathererComponent.getPreferredResourceDrain();
    if (!preferredResourceDrain) return State.FAILED;

    currentOrder.orderType = OrderType.ReturnResources;
    currentOrder.data.targetGameObject = preferredResourceDrain;
    return State.SUCCEEDED;
  }

  async AssignGatherResourcesOrder(): Promise<State> {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;

    const gathererComponent = getActorComponent(this.gameObject, GathererComponent);
    if (!gathererComponent) return State.FAILED;

    const preferredResourceSource = await gathererComponent.getPreferredResourceSource();
    if (!preferredResourceSource) return State.FAILED;

    currentOrder.orderType = OrderType.Gather;
    currentOrder.data.targetGameObject = preferredResourceSource;
    return State.SUCCEEDED;
  }

}
