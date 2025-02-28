import { State } from "mistreevous";
import { IPlayerPawnControllerAgent } from "./player-pawn-ai-controller.agent.interface";
import { getActorComponent } from "../../../../data/actor-component";
import { VisionComponent } from "../../../../entity/actor/components/vision-component";
import { GameplayLibrary } from "../../../../library/gameplay-library";
import { AttackComponent } from "../../../../entity/combat/components/attack-component";
import { getActorSystem } from "../../../../data/actor-system";
import {
  getRandomTileInNavigableRadius,
  MovementSystem,
  PathMoveConfig
} from "../../../../entity/systems/movement.system";
import { OrderLabelToTypeMap, OrderType } from "../../../../entity/character/ai/order-type";
import { PawnAiBlackboard } from "../../../../entity/character/ai/pawn-ai-blackboard";
import { Agent } from "mistreevous/dist/Agent";
import { GathererComponent } from "../../../../entity/actor/components/gatherer-component";
import { ResourceSourceComponent } from "../../../../entity/economy/resource/resource-source-component";
import { Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { HealthComponent } from "../../../../entity/combat/components/health-component";
import { ContainableComponent } from "../../../../entity/actor/components/containable-component";
import { ResourceDrainComponent } from "../../../../entity/economy/resource/resource-drain-component";
import { BuilderComponent } from "../../../../entity/actor/components/builder-component";
import { OrderData } from "../../../../entity/character/ai/OrderData";

export class PlayerPawnAiControllerAgent implements IPlayerPawnControllerAgent, Agent {
  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private readonly blackboard: PawnAiBlackboard
  ) {}

  [propertyName: string]: unknown;

  OrderExistsInQueue() {
    return this.blackboard.anyOrderInQueue();
  }

  AssignNextOrderFromQueue() {
    const playerOrder = this.blackboard.pullNextPlayerOrder();
    if (!playerOrder) return State.FAILED;
    this.blackboard.setCurrentOrder(playerOrder);
    return State.SUCCEEDED;
  }

  PlayerOrderIs(orderType: string) {
    const currentOrder = this.blackboard.getCurrentOrder();
    return currentOrder?.orderType === OrderLabelToTypeMap[orderType];
  }

  HasAttackComponent() {
    // noinspection UnnecessaryLocalVariableJS
    const hasComponent = !!getActorComponent(this.gameObject, AttackComponent);
    return hasComponent;
  }

  TargetIsAlive() {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return false;
    const target = currentOrder.data.targetGameObject;
    if (!target) return false;
    const healthComponent = getActorComponent(target, HealthComponent);
    if (!healthComponent) return false;
    return healthComponent.healthComponentData.health > 0;
  }

  HealthAboveThresholdPercentage(threshold: number) {
    const healthComponent = getActorComponent(this.gameObject, HealthComponent);
    if (!healthComponent) return false;
    const healthPercentage =
      (healthComponent.healthComponentData.health / healthComponent.healthDefinition.maxHealth) * 100;
    return healthPercentage > threshold;
  }

  InRange(type: "gather" | "attack" | "dropOff" | "construct") {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return false;
    const target = currentOrder.data.targetGameObject;
    if (!target) return false;
    const range = this.getRangeToTarget(type);
    if (!range) return false;

    const distance = GameplayLibrary.getTileDistanceBetweenGameObjects(this.gameObject, target);
    if (distance === null) return false;
    return distance <= range;
  }

  private getRangeToTarget(type: "move" | "gather" | "attack" | "dropOff" | "construct"): number | undefined {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return undefined;
    const target = currentOrder.data.targetGameObject;
    if (!target) return undefined;

    switch (type) {
      case "move":
        return 0;
      case "attack":
        return getActorComponent(this.gameObject, AttackComponent)?.getMaximumRange();
      case "gather":
        return getActorComponent(this.gameObject, GathererComponent)?.getGatherRange(target);
      case "dropOff":
        return getActorComponent(target, ResourceDrainComponent)?.getDropOffRange();
      case "construct":
        return getActorComponent(this.gameObject, BuilderComponent)?.getConstructionRange("");
      default:
        return undefined;
    }
  }

  async MoveToTarget(type: "move" | "gather" | "attack" | "dropOff" | "construct"): Promise<State> {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    const target = currentOrder.data.targetGameObject;
    if (!target) return State.FAILED;
    const range = this.getRangeToTarget(type);
    if (range === undefined) return State.FAILED;
    const movementSystem = getActorSystem(this.gameObject, MovementSystem);
    if (!movementSystem) return State.FAILED;
    try {
      const canMoveToTarget = await this.CanMoveToTarget(range);
      if (!canMoveToTarget) return State.FAILED;
      // console.log("Moving to target!");
      const success = await movementSystem.moveToActor(target, {
        radiusTilesAroundDestination: range
      } satisfies Partial<PathMoveConfig>);
      return success ? State.SUCCEEDED : State.FAILED;
    } catch (e) {
      console.error("Error in MoveToTarget", e);
      return State.FAILED;
    }
  }

  async MoveToTargetOrLocation(type: "move" | "gather" | "attack" | "dropOff" | "construct"): Promise<State> {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    const target = currentOrder.data.targetGameObject;
    const location = currentOrder.data.targetLocation;
    if (target) {
      return await this.MoveToTarget(type);
    } else if (location) {
      return await this.MoveToLocation();
    } else {
      return Promise.resolve(State.FAILED);
    }
  }

  async MoveToLocation() {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    const location = currentOrder.data.targetLocation;
    if (!location) return State.FAILED;
    const movementSystem = getActorSystem(this.gameObject, MovementSystem);
    if (!movementSystem) return State.FAILED;
    try {
      const success = await movementSystem.moveToLocation(location);
      return success ? State.SUCCEEDED : State.FAILED;
    } catch (e) {
      console.error("Error in MoveToLocation", e);
      return State.FAILED;
    }
  }

  Stop = () => {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (currentOrder) {
      if (currentOrder.orderType === OrderType.Move) {
        const movementSystem = getActorSystem(this.gameObject, MovementSystem);
        if (movementSystem) {
          movementSystem.cancelMovement();
        }
      }
    }
    return State.SUCCEEDED;
  };

  Attack() {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    const target = currentOrder.data.targetGameObject;
    if (!target) return State.FAILED;
    const attackComponent = getActorComponent(this.gameObject, AttackComponent);
    if (!attackComponent) return State.FAILED;
    const primaryAttack = attackComponent.primaryAttack;
    if (primaryAttack === null) return State.FAILED;
    attackComponent.useAttack(primaryAttack, target);
    return State.SUCCEEDED;
  }

  AnyEnemyVisible() {
    const visionComponent = getActorComponent(this.gameObject, VisionComponent);
    if (!visionComponent) return false;
    return visionComponent.getVisibleEnemies().length > 0;
  }

  private async CanMoveToTarget(range: number): Promise<boolean> {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return false;
    const target = currentOrder.data.targetGameObject;
    if (!target) return Promise.resolve(false);
    const movementSystem = getActorSystem(this.gameObject, MovementSystem);
    if (!movementSystem) return Promise.resolve(false);
    // noinspection UnnecessaryLocalVariableJS
    return await movementSystem.canMoveTo(target, range);
  }

  AcquireNewResourceSource() {
    const gathererComponent = getActorComponent(this.gameObject, GathererComponent);
    if (!gathererComponent) return State.FAILED;
    let resourceSource = gathererComponent.getPreferredResourceSource();
    const currentResources = resourceSource?.active
      ? getActorComponent(resourceSource, ResourceSourceComponent)?.getCurrentResources()
      : 0;
    if (!currentResources || currentResources <= 0) {
      resourceSource = gathererComponent.getNewResourceSource();
    }
    if (!resourceSource) return State.FAILED;
    this.blackboard.addOrder(new OrderData(OrderType.Gather, { targetGameObject: resourceSource }));
    return State.SUCCEEDED;
  }

  AssignResourceDropOff() {
    const gathererComponent = getActorComponent(this.gameObject, GathererComponent);
    if (!gathererComponent) return State.FAILED;
    const resourceDrain = gathererComponent.getPreferredResourceDrain();
    if (!resourceDrain) return State.FAILED;
    this.blackboard.addOrder(new OrderData(OrderType.ReturnResources, { targetGameObject: resourceDrain }));
    return State.SUCCEEDED;
  }

  async GatherResource(): Promise<State> {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    const target = currentOrder.data.targetGameObject;
    if (!target) return State.FAILED;
    const gathererComponent = getActorComponent(this.gameObject, GathererComponent);
    if (!gathererComponent) return State.FAILED;
    const successfullyStarted = gathererComponent.startGatheringResources(target);
    if (!successfullyStarted) return State.FAILED;
    await gathererComponent.gatherResources(target);
    return State.SUCCEEDED;
  }

  async DropOffResources() {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    const target = currentOrder.data.targetGameObject;
    if (!target) return State.FAILED;
    const gathererComponent = getActorComponent(this.gameObject, GathererComponent);
    if (!gathererComponent) return State.FAILED;
    await gathererComponent.returnResources(target);
    return State.SUCCEEDED;
  }

  ContinueGathering() {
    this.AcquireNewResourceSource();
    return State.SUCCEEDED;
  }

  /**
   * Command the agent to leave a construction site or container
   */
  LeaveConstructionSiteOrCurrentContainer() {
    const containableComponent = getActorComponent(this.gameObject, ContainableComponent);
    if (!containableComponent) return State.SUCCEEDED;
    containableComponent.leaveContainer();
    return State.SUCCEEDED;
  }

  ConstructBuilding() {
    const builderComponent = getActorComponent(this.gameObject, BuilderComponent);
    if (!builderComponent) return State.FAILED;
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    const target = currentOrder.data.targetGameObject;
    if (!target) return State.FAILED;
    builderComponent.assignToConstructionSite(target);
    return State.SUCCEEDED;
  }

  Attacked() {
    const attackedCooldown = 1000;
    const healthComponent = getActorComponent(this.gameObject, HealthComponent);
    if (!healthComponent) return false;
    // noinspection UnnecessaryLocalVariableJS
    const attacked = (healthComponent.latestDamage?.timestamp.getTime() ?? 0) > new Date().getTime() - attackedCooldown;
    return attacked;
  }

  AssignEnemy(source: string): State {
    switch (source) {
      case "vision":
        const visionComponent = getActorComponent(this.gameObject, VisionComponent);
        if (!visionComponent) return State.FAILED;
        const visibleEnemy = visionComponent.getClosestVisibleEnemy();
        if (!visibleEnemy) return State.FAILED;
        this.blackboard.addOrder(new OrderData(OrderType.Attack, { targetGameObject: visibleEnemy }));
        return State.SUCCEEDED;
      case "retaliation": // todo
        const healthComponent = getActorComponent(this.gameObject, HealthComponent);
        if (!healthComponent) return State.FAILED;
        const latestDamage = healthComponent.latestDamage;
        if (!latestDamage) return State.FAILED;
        const attacker = latestDamage.damageInitiator;
        if (!attacker) return State.FAILED;
        this.blackboard.addOrder(new OrderData(OrderType.Attack, { targetGameObject: attacker }));
        return State.SUCCEEDED;
      default:
        console.error("Invalid source for AssignEnemy.");
        return State.FAILED;
    }
  }

  /**
   * Command the agent to move randomly within the specified range
   */
  async AssignMoveRandomlyInRange(range: number) {
    const movementSystem = getActorSystem(this.gameObject, MovementSystem);
    if (!movementSystem) return State.FAILED;
    const randomTile = await getRandomTileInNavigableRadius(this.gameObject, range);
    if (!randomTile) return State.FAILED;
    const targetLocation = { x: randomTile.x, y: randomTile.y, z: 0 } satisfies Vector3Simple;
    this.blackboard.addOrder(new OrderData(OrderType.Move, { targetLocation }));
    return State.SUCCEEDED;
  }

  /**
   * Check if the cooldown period has passed for an action like resource gathering or attack
   */
  CooldownReady(type: string) {
    if (type === "attack") {
      const attackComponent = getActorComponent(this.gameObject, AttackComponent);
      if (!attackComponent) return false;
      return attackComponent.remainingCooldown <= 0;
    } else if (type === "gather") {
      const gathererComponent = getActorComponent(this.gameObject, GathererComponent);
      if (!gathererComponent) return false;
      return gathererComponent.remainingCooldown <= 0;
    }
    return false;
  }

  TargetExists() {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return false;
    return !!currentOrder.data.targetGameObject;
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

  NoEnemiesVisible() {
    // Check if there are no enemies visible to the agent
    return false;
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

  Succeed() {
    return State.SUCCEEDED;
  }
  Fail() {
    return State.FAILED;
  }
}
