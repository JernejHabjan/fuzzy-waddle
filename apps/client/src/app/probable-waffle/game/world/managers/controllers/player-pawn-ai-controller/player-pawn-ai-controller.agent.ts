import { State } from "mistreevous";
import { IPlayerPawnControllerAgent } from "./player-pawn-ai-controller.agent.interface";
import { getActorComponent } from "../../../../data/actor-component";
import { VisionComponent } from "../../../../entity/actor/components/vision-component";
import { GameplayLibrary } from "../../../../library/gameplay-library";
import { AttackComponent } from "../../../../entity/combat/components/attack-component";
import { getActorSystem } from "../../../../data/actor-system";
import { getRandomTileInNavigableRadius, MovementSystem } from "../../../../entity/systems/movement.system";
import { OrderLabelToTypeMap, OrderType } from "../../../../entity/character/ai/order-type";
import { PawnAiBlackboard } from "../../../../entity/character/ai/pawn-ai-blackboard";
import { Agent } from "mistreevous/dist/Agent";
import { GathererComponent } from "../../../../entity/actor/components/gatherer-component";
import { ResourceSourceComponent } from "../../../../entity/economy/resource/resource-source-component";
import { Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { HealthComponent } from "../../../../entity/combat/components/health-component";
import { ContainableComponent } from "../../../../entity/actor/components/containable-component";

export class PlayerPawnAiControllerAgent implements IPlayerPawnControllerAgent, Agent {
  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private readonly blackboard: PawnAiBlackboard
  ) {}

  [propertyName: string]: unknown;

  PlayerOrderExists() {
    return !!this.blackboard.playerOrderType;
  }

  PlayerOrderIs(orderType: string) {
    // Check if the current player order matches the specified order type
    return this.blackboard.playerOrderType === OrderLabelToTypeMap[orderType];
  }

  HasAttackComponent() {
    return getActorComponent(this.gameObject, AttackComponent) !== null;
  }

  TargetIsAlive() {
    const target = this.blackboard.targetGameObject;
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

  InRange() {
    const range = getActorComponent(this.gameObject, AttackComponent)?.getMaximumRange();
    if (!range) return false;
    const target = this.blackboard.targetGameObject;
    if (!target) return false;
    const distance = GameplayLibrary.getDistanceBetweenActors(this.gameObject, target);
    if (distance === null) return false;
    return distance <= range;
  }

  MoveToTarget() {
    // Command the agent to move to the target
    console.log("Moving to target!");
    this.blackboard.aiOrderType = OrderType.Move;

    return State.SUCCEEDED;
  }

  Stop() {
    // Command the agent to stop its current action
    console.log("Agent stopped.");
    return State.SUCCEEDED;
  }

  Attack() {
    const target = this.blackboard.targetGameObject;
    if (!target) return State.FAILED;
    const attackComponent = getActorComponent(this.gameObject, AttackComponent);
    if (!attackComponent) return State.FAILED;
    const primaryAttack = attackComponent.primaryAttack;
    if (!primaryAttack) return State.FAILED;
    attackComponent.useAttack(primaryAttack, target);
    return State.SUCCEEDED;
  }

  AnyEnemyVisible() {
    const visionComponent = getActorComponent(this.gameObject, VisionComponent);
    if (!visionComponent) return false;
    return visionComponent.getVisibleEnemies().length > 0;
  }

  CanMoveToTarget(): Promise<boolean> {
    const movementSystem = getActorSystem(this.gameObject, MovementSystem);
    if (!movementSystem) return Promise.resolve(false);
    // noinspection UnnecessaryLocalVariableJS
    return movementSystem.canMoveTo(this.blackboard.targetGameObject);
  }

  AcquireNewResourceSource() {
    // Find a new resource to gather from
    console.log("Acquiring new resource source!");
    return State.SUCCEEDED;
  }

  GatherResource() {
    const target = this.blackboard.targetGameObject;
    if (!target) return State.FAILED;
    const gathererComponent = getActorComponent(this.gameObject, GathererComponent);
    if (!gathererComponent) return State.FAILED;
    gathererComponent.startGatheringResources(target);
    return State.SUCCEEDED;
  }

  TargetDepleted() {
    // Check if the resource target is depleted
    return false;
  }

  ReturnResources() {
    // Command the agent to return gathered resources to the drop-off point
    console.log("Returning resources to drop-off.");
    return State.SUCCEEDED;
  }

  InRangeOfResourceDropOff() {
    // Check if the agent is in range of the resource drop-off point
    return false;
  }

  DropOffResources() {
    // Command the agent to drop off gathered resources
    console.log("Dropping off resources.");
    return State.SUCCEEDED;
  }

  ContinueGathering() {
    this.blackboard.aiOrderType = OrderType.Gather;
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
    // Command the agent to construct a building
    console.log("Constructing building!");
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
        const visibleEnemies = visionComponent.getVisibleEnemies();
        if (visibleEnemies.length === 0) return State.FAILED;
        this.blackboard.targetGameObject = visibleEnemies[0];
        return State.SUCCEEDED;
      case "retaliation": // todo
        const healthComponent = getActorComponent(this.gameObject, HealthComponent);
        if (!healthComponent) return State.FAILED;
        const latestDamage = healthComponent.latestDamage;
        if (!latestDamage) return State.FAILED;
        this.blackboard.targetGameObject = latestDamage.damageInitiator;
        return State.SUCCEEDED;
      default:
        console.error("Invalid source for AssignEnemy.");
        return State.FAILED;
    }
  }

  /**
   * Command the agent to move randomly within the specified range
   */
  async MoveRandomlyInRange(range: number) {
    const movementSystem = getActorSystem(this.gameObject, MovementSystem);
    if (!movementSystem) return State.FAILED;
    const randomTile = await getRandomTileInNavigableRadius(this.gameObject, range);
    if (!randomTile) return State.FAILED;
    this.blackboard.targetLocation = { x: randomTile.x, y: randomTile.y, z: 0 } satisfies Vector3Simple;
    await movementSystem.moveToLocation(this.blackboard.targetLocation);
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
    return this.blackboard.targetGameObject !== null;
  }

  /**
   * Check if the target still has resources to gather
   */
  TargetHasResources() {
    const target = this.blackboard.targetGameObject;
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
    return getActorComponent(this.gameObject, GathererComponent) !== null;
  }

  CurrentlyGatheringResources(): boolean {
    const gathererComponent = getActorComponent(this.gameObject, GathererComponent);
    if (!gathererComponent) return false;
    return gathererComponent.isGathering;
  }
}
