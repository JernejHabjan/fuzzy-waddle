import { State } from "mistreevous";
import { type IPlayerControllerAgent } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/player-ai-controller.agent.interface";
import { type Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import { getActorComponent } from "../../data/actor-component";
import { ProductionComponent } from "../../entity/components/production/production-component";
import { MapAnalyzer } from "./ai-behavior/map-analyzer";
import { AI_CONFIG } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/ai-config";
import { PlayerAiCombatAgent } from "./player-ai-combat-agent";

/** Behavior-tree facade. Pure planning and the retained legacy fallback share one lifecycle and observation owner. */
export class PlayerAiControllerAgent extends PlayerAiCombatAgent implements IPlayerControllerAgent {
  // needed only when passing this agent to BehaviourTree constructor
  [propertyName: string]: unknown;

  async AnalyzeGameMap(): Promise<State> {
    // Cooldown gating: avoid excessive map analyses.
    const now = this.blackboard.getNow();
    if (!this.cooldowns.canRun("analyzeMap", now)) {
      this.logDebugInfo("[Map] Analysis on cooldown");
      return State.FAILED;
    }
    try {
      if (!this.mapAnalyzer) this.mapAnalyzer = new MapAnalyzer(this.scene, this.player.playerNumber!);
      this.logDebugInfo("[Map] Starting map analysis...");
      const result = await this.mapAnalyzer.analyzeIfStale(AI_CONFIG.mapAnalysisIntervalMs);
      this.blackboard.mapAnalysis = result;
      this.blackboard.baseCenterTile = result.baseCenterTile ?? null;
      this.blackboard.suggestedBuildTiles = result.candidateBuildSpots ?? [];
      this.logDebugInfo(
        `[Map] Analysis complete. Base center: ${result.baseCenterTile?.x},${result.baseCenterTile?.y}, Build spots: ${result.candidateBuildSpots?.length || 0}`
      );
      await this.basePlanner.updateFromAnalysis(result);
      this.cooldowns.markRun("analyzeMap", now);
      this.blackboard.cooldowns.analyzeMap = now; // mirror timestamp for other systems
      return State.SUCCEEDED;
    } catch (error) {
      this.logDebugInfo("[Map] Analysis failed:", error);
      return State.FAILED;
    }
  }

  HasIdleProductionBuilding() {
    return this.blackboard.productionBuildings.some((building) => {
      const productionComponent = getActorComponent(building, ProductionComponent);
      return productionComponent?.isIdle;
    });
  }

  HasSurplusResources() {
    const threshold = this.adaptiveThresholds.getResourceSurplusThreshold();
    const total = this.blackboard.getTotalResources();
    const hasSurplus = total > threshold;
    this.logDebugInfo(
      `[Resources] Surplus check: ${total.toFixed(0)} vs threshold ${threshold} = ${hasSurplus ? "YES" : "NO"}`
    );
    return hasSurplus;
  }

  NeedToScout() {
    return this.scoutingManager.needToScout();
  }

  AssignScoutUnits() {
    if (this.scoutingManager.assignScoutUnits()) return State.SUCCEEDED;
    return State.FAILED;
  }

  IsInCombat() {
    return this.combatMicro.isInCombat();
  }

  RetreatLowHealthUnitsInCombat() {
    if (this.combatMicro.retreatLowHealthUnitsInCombat()) return State.SUCCEEDED;
    return State.FAILED;
  }

  FocusFireForUnitsInCombat() {
    if (this.combatMicro.focusFireForUnitsInCombat()) return State.SUCCEEDED;
    return State.FAILED;
  }

  FlankEnemy() {
    if (this.combatMicro.flankEnemy()) return State.SUCCEEDED;
    return State.FAILED;
  }

  EnemyFlankOpen(): boolean {
    return this.blackboard.enemyFlankOpen;
  }

  DecideNextMoveBasedOnAnalysis(): State {
    this.logDebugInfo("Deciding next move based on enemy analysis.");
    return State.SUCCEEDED;
  }

  ContinueScouting() {
    this.logDebugInfo("Continuing to scout the map.");
    return State.SUCCEEDED;
  }

  // ================= MDSL Wrapper Methods (delegating to managers / helpers) =================
  // Add logistics & tech + micro wrappers not previously present.
  ShouldRebalanceHarvesters(): boolean {
    return this.logisticsManager.shouldRebalance();
  }

  async RebalanceHarvesterAllocation(): Promise<State> {
    return this.logisticsManager.rebalanceHarvesters();
  }

  StockpileImbalanceDetected(): boolean {
    return this.logisticsManager.stockpileImbalanceDetected();
  }

  async RedirectWorkersToScarceResource(): Promise<State> {
    return this.logisticsManager.redirectToScarce();
  }

  ShouldPursueResearch(): boolean {
    return !this.purePlannerOwnsResearch && this.techManager.shouldPursueResearch();
  }

  IsResearchInProgress(): boolean {
    return this.techManager.isResearchInProgress();
  }

  TryStartResearch(): State {
    return this.purePlannerOwnsResearch ? State.FAILED : this.techManager.tryStartResearch();
  }

  ShouldReanalyzeMap(): boolean {
    if (!this.mapAnalyzer) return true;
    return this.mapAnalyzer.isStale(AI_CONFIG.mapAnalysisIntervalMs);
  }

  ShouldReplanBase(): boolean {
    return (
      this.basePlanner.getCurrentNeeds().length === 0 || this.basePlanner.isNeedsStale(AI_CONFIG.baseReplanStaleMs)
    ); // extracted 4000
  }

  ReplanBase(): State {
    try {
      this.basePlanner.planBaseIfStale(this.blackboard, AI_CONFIG.baseReplanStaleMs, this.adaptiveThresholds); // extracted 4000
      // Debug: show how many plan reservations currently tracked
      const planCount = this.basePlanner.getPlannedBuildings().length;
      this.logDebugInfo("ReplanBase executed. Active plan reservations:", planCount);
      return State.SUCCEEDED;
    } catch {
      return State.FAILED;
    }
  }

  HasPlannedBuildingNeed(): boolean {
    const needs = this.basePlanner.getCurrentNeeds();
    if (needs.length > 0) {
      const nextType = needs[0]!.type;
      if (nextType) this.logDebugInfo("Next needed building type:", nextType);
      return true;
    }
    return false;
  }

  async EnsureReservationForNextNeed(): Promise<State> {
    const res = await this.basePlanner.ensureReservationForTopNeed(this.blackboard);
    return res ? State.SUCCEEDED : State.FAILED;
  }

  HasResourcesForReservedBuilding(): boolean {
    return this.basePlanner.hasResourcesForReservedBuilding(this.blackboard);
  }

  AttemptPlacePlannedBuilding(): State {
    const reserved = this.basePlanner.getReservedBuilding();
    if (!reserved) return State.FAILED;
    if (!this.basePlanner.hasResourcesForObjectName(reserved.objectName, this.blackboard)) return State.FAILED;
    // Pass reserved tile directly so placement prefers planning reservation
    const result = this.assignBuilding(reserved.objectName, {
      x: reserved.tile.x,
      y: reserved.tile.y,
      z: 0
    } as Vector3Simple);
    this.basePlanner.clearReservedBuilding();
    return result;
  }

  HasDamagedStructures(): boolean {
    return this.repairManager.hasDamagedStructures();
  }

  AssignRepairWorkers(): State {
    return this.repairManager.assignRepairWorkers();
  }

  AssignDefenders(): State {
    return this.AssignDefendersToEnemies();
  }

  EnemySpotted(): boolean {
    return this.blackboard.visibleEnemies.length > 0;
  }

  async AnalyzeEnemyBase(): Promise<State> {
    return await this.AnalyzeGameMap();
  }

  async GatherEnemyData(): Promise<State> {
    // Placeholder: simply succeed after ensuring targeting manager updated.
    await this.targetingManager.update(this.blackboard.getNow());
    return State.SUCCEEDED;
  }

  ShouldProduceMilitaryUnit(): boolean {
    return this.forceMaintenance.shouldProduceMilitaryUnit();
  }

  HasResourcesForQueuedUnit(): boolean {
    return this.forceMaintenance.hasResourcesForQueuedUnit();
  }

  HasSupplyCapacity(): boolean {
    return !this.forceMaintenance.isSupplyCapped();
  }

  QueueMilitaryUnitProduction(): State {
    return this.forceMaintenance.queueMilitaryUnitProduction();
  }

  public getTelemetrySnapshot() {
    // a bit of a hack to get telemetry... but it works for now
    const bb = this.blackboard as any;
    if (!bb.diagnostics.telemetry) {
      bb.diagnostics.telemetry = {
        spans: {},
        counters: {}
      };
    }
    return bb.diagnostics.telemetry;
  }
}
