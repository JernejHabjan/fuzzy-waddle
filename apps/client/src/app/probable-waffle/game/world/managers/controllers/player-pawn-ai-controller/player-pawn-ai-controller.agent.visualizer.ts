import { State } from "mistreevous";
import { IPlayerPawnControllerAgent } from "./player-pawn-ai-controller.agent.interface";
import { getBooleanValue, showInfoToast } from "../behavior-tree-utilities/behavior-tree-global-functions";

/**
 * https://nikkorn.github.io/mistreevous-visualiser/index.html
 */
class PlayerPawnAiControllerAgentVisualizer implements IPlayerPawnControllerAgent {
  orderQueue = [];
  currentOrder = null;

  OrderExistsInQueue() {
    return !!this.orderQueue.length;
  }

  AssignNextOrderFromQueue() {
    // @ts-expect-error - unused parameter.
    this.currentOrder = this.orderQueue.shift();
    return State.SUCCEEDED;
  }

  // @ts-expect-error - unused parameter.
  PlayerOrderIs(orderType) {
    return this.currentOrder?.["orderType"] === orderType;
  }

  HasAttackComponent() {
    // Check if the agent has the capability to attack
    return getBooleanValue("Does the agent have an attack component?");
  }

  TargetIsAlive() {
    // Check if the target is still alive
    return getBooleanValue("Is the target alive?");
  }

  InRange() {
    // Check if the agent is within range of the target
    return Promise.resolve(State.SUCCEEDED);
  }

  MoveToTarget() {
    // Command the agent to move to the target
    showInfoToast("Moving to target!");
    return Promise.resolve(State.SUCCEEDED);
  }

  MoveToTargetOrLocation() {
    // Command the agent to move to the target or a specific location
    showInfoToast("Moving to target or location!");
    return Promise.resolve(State.SUCCEEDED);
  }

  MoveToLocation() {
    // Command the agent to move to a specific location
    showInfoToast("Moving to location!");
    return Promise.resolve(State.SUCCEEDED);
  }

  Heal() {
    // Command the agent to heal the target
    showInfoToast("Healing the target!");
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
    showInfoToast("Acquiring new resource source.");
    // @ts-expect-error - unused parameter.
    this.orderQueue.push({ orderType: "gather", target: "resource" });
    return State.SUCCEEDED;
  }

  GatherResource() {
    // Command the agent to gather resources
    showInfoToast("Gathering resources!");
    return Promise.resolve(State.SUCCEEDED);
  }

  DropOffResources() {
    // Command the agent to return gathered resources to the drop-off point
    showInfoToast("Returning resources to drop-off.");
    return Promise.resolve(State.SUCCEEDED);
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

  AssignEnemy() {
    // Assign an enemy to the agent
    showInfoToast("Assigning enemy.");
    // @ts-expect-error - unused parameter.
    this.orderQueue.push({ orderType: "attack", target: "enemy" });
    return State.SUCCEEDED;
  }

  // @ts-expect-error - unused parameter.
  AssignMoveRandomlyInRange(range) {
    // Command the agent to move randomly within the specified range
    showInfoToast(`Moving randomly within range: ${range}`);
    // @ts-expect-error - unused parameter.
    this.orderQueue.push({ orderType: "move", target: "random" });
    return Promise.resolve(State.SUCCEEDED);
  }

  CooldownReady() {
    // Check if the cooldown period has passed for an action like resource gathering or attack
    return getBooleanValue("Is the cooldown ready?");
  }

  TargetExists() {
    // Check if the movement target exists
    return getBooleanValue("Does the target exist?");
  }

  TargetOrLocationExists() {
    // Check if the target or location exists
    return getBooleanValue("Does the target or location exist?");
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

  GatherCapacityFull() {
    return getBooleanValue("Is the agent gathering capacity full?");
  }

  Succeed() {
    return State.SUCCEEDED;
  }

  Fail() {
    return State.FAILED;
  }

  Log() {
    return State.SUCCEEDED;
  }
}
