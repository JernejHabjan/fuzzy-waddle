import { State } from "mistreevous";
import { IPlayerControllerAgent } from "./player-ai-controller.agent.interface";
import { Agent } from "mistreevous/dist/Agent";
import { PlayerAiBlackboard } from "../../../../entity/character/ai/player-ai/player-ai-blackboard";

export class PlayerAiControllerAgent implements IPlayerControllerAgent, Agent {
  constructor(blackboard: PlayerAiBlackboard) {} // todo add parameters for current ai player

  [propertyName: string]: unknown;

  IsBaseUnderAttack() {
    return false;
  }

  IsBaseUnderHeavyAttack() {
    return false;
  }

  IsEnemyVisible() {
    return false;
  }

  HasEnoughMilitaryPower() {
    return false;
  }

  HasSurplusResources() {
    return false;
  }

  AssignDefendersToEnemies() {
    console.log("Assigning defenders to enemies.");
    return State.SUCCEEDED;
  }

  AttackEnemyBase() {
    console.log("Attacking enemy base!");
    return State.SUCCEEDED;
  }

  NeedMoreResources() {
    return false;
  }

  IsBaseExpansionNeeded() {
    return false;
  }

  HasSufficientResources() {
    return false;
  }

  ResourceShortage() {
    return false;
  }

  ChooseStructureToBuild() {
    console.log("Choosing structure to build...");
    return State.SUCCEEDED;
  }

  AssignWorkersToGather() {
    console.log("Assigning workers to gather resources...");
    return State.SUCCEEDED;
  }

  HasIdleTrainingBuilding() {
    return false;
  }

  HasEnoughResourcesForWorker() {
    return false;
  }

  TrainWorker() {
    console.log("Training a new worker...");
    return State.SUCCEEDED;
  }

  GatherResources() {
    console.log("Gathering resources...");
    return State.SUCCEEDED;
  }

  AssignWorkerToBuild() {
    console.log("Assigning worker to build...");
    return State.SUCCEEDED;
  }

  StartBuildingStructure() {
    console.log("Starting to build structure...");
    return State.SUCCEEDED;
  }

  ContinueNormalGathering() {
    console.log("Continuing normal gathering...");
    return State.SUCCEEDED;
  }

  ReassignWorkersToResource() {
    console.log("Reassigning workers to critical resources.");
    return State.SUCCEEDED;
  }

  SufficientResourcesForUpgrade() {
    return false;
  }

  StartUpgrade() {
    console.log("Starting a tech or unit upgrade.");
    return State.SUCCEEDED;
  }

  NeedMoreHousing() {
    return false;
  }

  NeedMoreProduction() {
    return false;
  }

  NeedMoreDefense() {
    return false;
  }

  NeedToScout() {
    return false;
  }

  AssignScoutUnits() {
    console.log("Sending scouts to explore!");
    return State.SUCCEEDED;
  }

  IsInCombat() {
    return false;
  }

  LowHealthUnit() {
    return false;
  }

  RetreatUnit() {
    console.log("Retreating low-health unit.");
    return State.SUCCEEDED;
  }

  FocusFire() {
    console.log("Focusing fire on enemy unit.");
    return State.SUCCEEDED;
  }

  FlankEnemy() {
    console.log("Flanking the enemy.");
    return State.SUCCEEDED;
  }

  EnemySpotted() {
    return false;
  }

  AnalyzeEnemyBase() {
    console.log("Analyzing enemy base.");
    return State.SUCCEEDED;
  }

  GatherEnemyData() {
    return State.SUCCEEDED;
  }

  EnemyInRange() {
    return false;
  }

  EnemyFlankOpen() {
    return false;
  }

  DecideNextMoveBasedOnAnalysis() {
    return State.SUCCEEDED;
  }

  IsPlayerWeak() {
    return false;
  }

  ContinueScouting() {
    console.log("Continuing to scout the map.");
    return State.SUCCEEDED;
  }

  ShiftToAggressiveStrategy() {
    console.log("Shifting to aggressive strategy.");
    return State.SUCCEEDED;
  }

  ShiftToDefensiveStrategy() {
    console.log("Shifting to defensive strategy.");
    return State.SUCCEEDED;
  }

  ShiftToEconomicStrategy() {
    console.log("Shifting to economic strategy.");
    return State.SUCCEEDED;
  }
}
