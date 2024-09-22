import { State } from "mistreevous";
import { IPlayerPawnControllerAgent } from "./player-pawn-ai-controller.agent.interface";
import {
  getBooleanValue,
  getNumberValue,
  getStringValue,
  showInfoToast
} from "../behavior-tree-utilities/behavior-tree-global-functions";

/**
 * https://nikkorn.github.io/mistreevous-visualiser/index.html
 */
class PlayerPawnAiControllerAgentVisualizer implements IPlayerPawnControllerAgent {
  PlayerOrderExists() {
    // Check if there's an order assigned to the player
    return getBooleanValue("Is there a player order?");
  }

  PlayerOrderIs(orderType) {
    // Check if the current player order matches the specified order type
    return getStringValue("What is the current player order?") === orderType;
  }

  HasAttackComponent() {
    // Check if the agent has the capability to attack
    return getBooleanValue("Does the agent have an attack component?");
  }

  TargetIsAlive() {
    // Check if the target is still alive
    return getBooleanValue("Is the target alive?");
  }

  HealthAboveThreshold(threshold) {
    // Check if the agent's health is above a certain threshold
    return getNumberValue("What is the agent's current health?") > threshold;
  }

  InRange() {
    // Check if the agent is within range of the target
    return getBooleanValue("Is the agent in range of the target?");
  }

  MoveToTarget() {
    // Command the agent to move to the target
    showInfoToast("Moving to target!");
    return State.SUCCEEDED;
  }

  Stop() {
    // Command the agent to stop its current action
    showInfoToast("Agent stopped.");
    return State.SUCCEEDED;
  }

  Attack() {
    // Command the agent to attack the target
    showInfoToast("Attacking the target!");
    return State.SUCCEEDED;
  }

  AnyEnemyVisible() {
    // Check if there are any enemies visible to the agent
    return getBooleanValue("Are there any enemies visible?");
  }

  AcquireNewResourceSource() {
    // Find a new resource to gather from
    showInfoToast("Acquiring new resource source!");
    return State.SUCCEEDED;
  }

  CanGatherResource() {
    // Check if the agent can gather resources from the target
    return getBooleanValue("Can the agent gather resources?");
  }

  GatherResource() {
    // Command the agent to gather resources
    showInfoToast("Gathering resources!");
    return State.SUCCEEDED;
  }

  TargetDepleted() {
    // Check if the resource target is depleted
    return getBooleanValue("Is the target resource depleted?");
  }

  ReturnResources() {
    // Command the agent to return gathered resources to the drop-off point
    showInfoToast("Returning resources to drop-off.");
    return State.SUCCEEDED;
  }

  InRangeOfResourceDropOff() {
    // Check if the agent is in range of the resource drop-off point
    return getBooleanValue("Is the agent in range of the resource drop-off?");
  }

  DropOffResources() {
    // Command the agent to drop off gathered resources
    showInfoToast("Dropping off resources.");
    return State.SUCCEEDED;
  }

  ContinueGathering() {
    // Command the agent to continue gathering after dropping off resources
    showInfoToast("Continuing to gather resources.");
    return State.SUCCEEDED;
  }

  LeaveConstructionSiteOrCurrentContainer() {
    // Command the agent to leave a construction site or container
    showInfoToast("Leaving construction site or container.");
    return State.SUCCEEDED;
  }

  ConstructBuilding() {
    // Command the agent to construct a building
    showInfoToast("Constructing building!");
    return State.SUCCEEDED;
  }

  Attacked() {
    // Check if the agent has been attacked
    return getBooleanValue("Has the agent been attacked?");
  }

  AssignTarget(targetType) {
    // Assign the specified target to the agent (e.g., an attacker)
    showInfoToast(`Assigning target: ${targetType}`);
    return State.SUCCEEDED;
  }

  AttackEnemy() {
    // Command the agent to attack an enemy
    showInfoToast("Attacking enemy!");
    return State.SUCCEEDED;
  }

  PatrolOrIdle() {
    // Command the agent to patrol or idle when no enemies are visible
    showInfoToast("Patrolling or idling.");
    return State.SUCCEEDED;
  }

  MoveRandomlyInRange(range) {
    // Command the agent to move randomly within the specified range
    showInfoToast(`Moving randomly within range: ${range}`);
    return State.SUCCEEDED;
  }

  CooldownReady() {
    // Check if the cooldown period has passed for an action like resource gathering or attack
    return getBooleanValue("Is the cooldown ready?");
  }

  TargetExists() {
    // Check if the movement target exists
    return getBooleanValue("Does the target exist?");
  }

  TargetHasResources() {
    // Check if the target still has resources to gather
    return getBooleanValue("Does the target have resources?");
  }

  AnyHighValueResourceVisible() {
    // Check if there are high-value resources visible to prioritize gathering
    return getBooleanValue("Are there any high-value resources visible?");
  }

  GatherHighValueResource() {
    // Command the agent to gather from a high-value resource
    showInfoToast("Gathering high-value resource.");
    return State.SUCCEEDED;
  }

  NoEnemiesVisible() {
    // Check if there are no enemies visible to the agent
    return getBooleanValue("Are there no enemies visible?");
  }

  HasHarvestComponent() {
    // Check if the agent has the capability to harvest resources
    return getBooleanValue("Does the agent have a harvest component?");
  }

  CanMoveToTarget() {
    // Check if the agent can move to the target
    return Promise.resolve(getBooleanValue("Can the agent move to the target?"));
  }
}
