import { State } from "mistreevous";
import { IPlayerPawnControllerAgent } from "./player-pawn-ai-controller.agent.interface";
import { getActorComponent } from "../../../../data/actor-component";
import { VisionComponent } from "../../../../entity/actor/components/vision-component";
import { GameplayLibrary } from "../../../../library/gameplay-library";
import { AttackComponent } from "../../../../entity/combat/components/attack-component";
import { getActorSystem } from "../../../../data/actor-system";
import { MovementSystem } from "../../../../entity/systems/movement.system";
import { OrderType } from "../../../../entity/character/ai/order-type";
import { PawnAiBlackboard } from "../../../../entity/character/ai/pawn-ai-blackboard";
import { Agent } from "mistreevous/dist/Agent";

export class PlayerPawnAiControllerAgent implements IPlayerPawnControllerAgent, Agent {
  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private readonly blackboard: PawnAiBlackboard
  ) {}

  [propertyName: string]: unknown;

  PlayerOrderExists() {
    // Check if there's an order assigned to the player
    return false;
  }

  PlayerOrderIs(orderType: string) {
    // Check if the current player order matches the specified order type
    return false;
  }

  HasAttackComponent() {
    // Check if the agent has the capability to attack
    return false;
  }

  TargetIsAlive() {
    // Check if the target is still alive
    return false;
  }

  HealthAboveThreshold(threshold: number) {
    // Check if the agent's health is above a certain threshold
    return false;
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
    this.blackboard.orderType = OrderType.Move;

    return State.SUCCEEDED;
  }

  Stop() {
    // Command the agent to stop its current action
    console.log("Agent stopped.");
    return State.SUCCEEDED;
  }

  Attack() {
    // Command the agent to attack the target
    console.log("Attacking the target!");
    return State.SUCCEEDED;
  }

  AnyEnemyVisible() {
    const target = this.blackboard.targetGameObject;
    if (!target) return false;
    const visionComponent = getActorComponent(this.gameObject, VisionComponent);
    if (!visionComponent) return false;
    return visionComponent.isActorVisible(target) ?? false;
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

  CanGatherResource() {
    // Check if the agent can gather resources from the target
    return false;
  }

  GatherResource() {
    // Command the agent to gather resources
    console.log("Gathering resources!");
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
    // Command the agent to continue gathering after dropping off resources
    console.log("Continuing to gather resources.");
    return State.SUCCEEDED;
  }

  LeaveConstructionSiteOrCurrentContainer() {
    // Command the agent to leave a construction site or container
    console.log("Leaving construction site or container.");
    return State.SUCCEEDED;
  }

  ConstructBuilding() {
    // Command the agent to construct a building
    console.log("Constructing building!");
    return State.SUCCEEDED;
  }

  Attacked() {
    // Check if the agent has been attacked
    return false;
  }

  AssignTarget(targetType: string) {
    // Assign the specified target to the agent (e.g., an attacker)
    console.log(`Assigning target: ${targetType}`);
    return State.SUCCEEDED;
  }

  AttackEnemy() {
    // Command the agent to attack an enemy
    console.log("Attacking enemy!");
    return State.SUCCEEDED;
  }

  PatrolOrIdle() {
    // Command the agent to patrol or idle when no enemies are visible
    console.log("Patrolling or idling.");
    return State.SUCCEEDED;
  }

  MoveRandomlyInRange(range: number) {
    // Command the agent to move randomly within the specified range
    console.log(`Moving randomly within range: ${range}`);
    return State.SUCCEEDED;
  }

  CooldownReady() {
    // Check if the cooldown period has passed for an action like resource gathering or attack
    return false;
  }

  TargetExists() {
    // Check if the movement target exists
    return false;
  }

  TargetHasResources() {
    // Check if the target still has resources to gather
    return false;
  }

  AnyHighValueResourceVisible() {
    // Check if there are high-value resources visible to prioritize gathering
    return false;
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
    // Check if the agent has the capability to harvest resources
    return false;
  }
}
