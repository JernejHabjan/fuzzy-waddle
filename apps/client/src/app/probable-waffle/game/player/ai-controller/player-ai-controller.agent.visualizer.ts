import { State } from "mistreevous";
import { type IPlayerControllerAgent } from "./player-ai-controller.agent.interface";
import { getBooleanValue, showInfoToast } from "../../ai/behavior-tree-global-functions";

/**
 * https://nikkorn.github.io/mistreevous-visualiser/index.html
 */
class PlayerAiControllerAgentVisualizer implements IPlayerControllerAgent {
  IsBaseUnderAttack() {
    return getBooleanValue("Is the base under attack?");
  }

  IsBaseUnderHeavyAttack() {
    return getBooleanValue("Is the base under heavy attack?");
  }

  HasEnoughMilitaryPower() {
    return getBooleanValue("Does the AI have enough military units?");
  }

  HasSurplusResources() {
    return getBooleanValue("Does the AI have surplus resources?");
  }

  AssignDefendersToEnemies() {
    showInfoToast("Assigning defenders to enemies.");
    return State.SUCCEEDED;
  }

  AttackEnemyBase() {
    showInfoToast("Attacking enemy base!");
    return State.SUCCEEDED;
  }

  NeedMoreResources() {
    return getBooleanValue("Does the AI need more resources?");
  }

  IsBaseExpansionNeeded() {
    return getBooleanValue("Does the AI need more structures?");
  }

  HasSufficientResources() {
    return getBooleanValue("Does the AI have enough resources?");
  }

  ResourceShortage() {
    return getBooleanValue("Does the AI have a resource shortage?");
  }

  ChooseStructureToBuild() {
    showInfoToast("Choosing structure to build...");
    return State.SUCCEEDED;
  }

  AssignWorkersToGather() {
    showInfoToast("Assigning workers to gather resources...");
    return State.SUCCEEDED;
  }

  HasIdleTrainingBuilding() {
    return getBooleanValue("Is there an idle training building?");
  }

  HasEnoughResourcesForWorker() {
    return getBooleanValue("Does the AI have enough resources to train a worker?");
  }

  TrainWorker() {
    showInfoToast("Training a new worker...");
    return State.SUCCEEDED;
  }

  GatherResources() {
    showInfoToast("Gathering resources...");
    return State.SUCCEEDED;
  }

  AssignWorkerToBuild() {
    showInfoToast("Assigning worker to build...");
    return State.SUCCEEDED;
  }

  StartBuildingStructure() {
    showInfoToast("Starting to build structure...");
    return State.SUCCEEDED;
  }

  ContinueNormalGathering() {
    showInfoToast("Continuing normal gathering...");
    return State.SUCCEEDED;
  }

  NeedMoreWorkers() {
    return getBooleanValue("Does the AI need more workers?");
  }

  AssignWorkersToResource() {
    showInfoToast("Assigning workers to critical resources.");
    return State.SUCCEEDED;
  }

  ReassignWorkersToResource() {
    showInfoToast("Reassigning workers to critical resources.");
    return State.SUCCEEDED;
  }

  SufficientResourcesForUpgrade() {
    return getBooleanValue("Does the AI have enough resources for an upgrade?");
  }

  StartUpgrade() {
    showInfoToast("Starting a tech or unit upgrade.");
    return State.SUCCEEDED;
  }

  NeedMoreHousing() {
    return getBooleanValue("Does the AI need more housing?");
  }

  NeedMoreProduction() {
    return getBooleanValue("Does the AI need more production?");
  }

  NeedMoreDefense() {
    return getBooleanValue("Does the AI need more defense?");
  }

  AssignHousingBuilding() {
    showInfoToast("Assigning housing building.");
    return State.SUCCEEDED;
  }
  AssignProductionBuilding() {
    showInfoToast("Assigning production building.");
    return State.SUCCEEDED;
  }
  AssignDefenseBuilding() {
    showInfoToast("Assigning defense building.");
    return State.SUCCEEDED;
  }

  NeedToScout() {
    return getBooleanValue("Does the AI need to scout the map?");
  }

  AssignScoutUnits() {
    showInfoToast("Sending scouts to explore!");
    return State.SUCCEEDED;
  }

  IsInCombat() {
    return getBooleanValue("Is the AI currently in combat?");
  }

  LowHealthUnit() {
    return getBooleanValue("Does the AI have low-health units?");
  }

  RetreatUnit() {
    showInfoToast("Retreating low-health unit.");
    return State.SUCCEEDED;
  }

  FocusFire() {
    showInfoToast("Focusing fire on enemy unit.");
    return State.SUCCEEDED;
  }

  FlankEnemy() {
    showInfoToast("Flanking the enemy.");
    return State.SUCCEEDED;
  }

  EnemySpotted() {
    return getBooleanValue("Has the AI spotted an enemy?");
  }

  AnalyzeEnemyBase() {
    showInfoToast("Analyzing enemy base.");
    return State.SUCCEEDED;
  }

  GatherEnemyData() {
    return State.SUCCEEDED;
  }

  EnemyInRange() {
    return getBooleanValue("Is the enemy in range?");
  }

  EnemyFlankOpen() {
    return getBooleanValue("Is the enemy flank open?");
  }

  DecideNextMoveBasedOnAnalysis() {
    return State.SUCCEEDED;
  }

  IsEnemyPlayerWeak() {
    return getBooleanValue("Is the player weak?");
  }

  ContinueScouting() {
    showInfoToast("Continuing to scout the map.");
    return State.SUCCEEDED;
  }

  ShiftToAggressiveStrategy() {
    showInfoToast("Shifting to aggressive strategy.");
    return State.SUCCEEDED;
  }

  ShiftToDefensiveStrategy() {
    showInfoToast("Shifting to defensive strategy.");
    return State.SUCCEEDED;
  }

  ShiftToEconomicStrategy() {
    showInfoToast("Shifting to economic strategy.");
    return State.SUCCEEDED;
  }

  AnalyzeGameMap(): State {
    showInfoToast("Analyzing game map.");
    return State.SUCCEEDED;
  }
}
