import Phaser from "phaser";
import { ProbableWafflePlayer } from "@fuzzy-waddle/probable-waffle-protocol";
import { environment } from "@fuzzy-waddle/environments/environment";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { DebuggingService } from "../../world/services/DebuggingService";
import { Subscription } from "rxjs";
import { MapAnalyzer } from "./ai-behavior/map-analyzer";
import { BasePlanner } from "./ai-behavior/base-planner";
import { CooldownManager } from "./cooldown-manager";
import { makeHysteresisTracker } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/hysteresis-threshold";
import { ForceMaintenanceManager } from "./ai-behavior/force-maintenance-manager";
import { ProductionValidator } from "../../data/tech-tree/production-validator";
import { AI_CONFIG } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/ai-config";
import { RandomService } from "../../world/services/random.service";
import { RepairManager } from "./ai-behavior/repair-manager";
import { LogisticsManager } from "./ai-behavior/logistics-manager";
import { TechProgressManager } from "./ai-behavior/tech-progress-manager";
import { AdaptiveThresholdManager } from "./ai-behavior/adaptive-threshold-manager";
import { CombatMicroManager } from "./ai-behavior/combat-micro-manager";
import { ScoutingManager } from "./ai-behavior/scouting-manager";
import { TargetingManager } from "./ai-behavior/targeting-manager";
import { SupplyPlanner } from "./ai-behavior/supply-planner";
import { EconomyManager } from "./ai-behavior/economy-manager";
import { PlayerAiBlackboard } from "./player-ai-blackboard";
import { WorldStateSnapshotManager } from "./ai-behavior/world-state-snapshot-manager";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { AiDecisionTrace, type AiDecisionReasonCode, type AiDecisionTraceSnapshot } from "./ai-decision-trace";
import { AiObservationPipeline } from "./observation/ai-observation-pipeline";
import { SimulationTickService } from "../../world/services/simulation-tick.service";

/** Owns shared agent lifetime, managers and the observation boundary. Derived legacy actions retain one actor/command owner. */
export abstract class PlayerAiAgentContext {
  protected displayDebugInfo = false;

  protected aiDebuggingSubscription?: Subscription;

  protected mapAnalyzer?: MapAnalyzer;

  public basePlanner: BasePlanner;

  protected randomService: RandomService;

  protected cooldowns: CooldownManager;

  protected hysteresisAggressive = makeHysteresisTracker({
    enter: AI_CONFIG.hysteresisAggressiveEnter,
    exit: AI_CONFIG.hysteresisAggressiveExit
  });

  protected forceMaintenance: ForceMaintenanceManager;

  protected repairManager: RepairManager;

  logisticsManager: LogisticsManager;

  protected techManager: TechProgressManager;

  public adaptiveThresholds: AdaptiveThresholdManager;

  protected economyManager: EconomyManager;

  protected worldStateSnapshotManager: WorldStateSnapshotManager;

  protected readonly observationPipeline: AiObservationPipeline;

  protected combatMicro: CombatMicroManager;

  protected scoutingManager: ScoutingManager;

  protected targetingManager: TargetingManager;

  protected productionValidator: ProductionValidator;

  protected readonly decisionTrace: AiDecisionTrace;

  /** The pure planner is the only mutation authority for research in skirmish mode. */
  protected purePlannerOwnsResearch = false;

  /** The pure planner owns all player commands while the new skirmish brain is available. */
  protected purePlannerOwnsCommands = false;

  constructor(
    protected readonly scene: ProbableWaffleScene,
    protected readonly player: ProbableWafflePlayer,
    protected readonly blackboard: PlayerAiBlackboard
  ) {
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
    if (this.player.playerNumber === undefined) {
      throw new Error("AI decision trace requires an assigned player number");
    }
    this.decisionTrace = new AiDecisionTrace(this.player.playerNumber);
    this.randomService = getSceneService(this.scene, RandomService)!;
    this.cooldowns = new CooldownManager(this.randomService);
    this.mapAnalyzer = new MapAnalyzer(this.scene, this.player.playerNumber!);
    const supplyPlanner = new SupplyPlanner(this.blackboard);
    this.productionValidator = new ProductionValidator(this.scene, this.player, this.blackboard);
    this.logisticsManager = new LogisticsManager(this.blackboard, this.logDebugInfo.bind(this));
    this.basePlanner = new BasePlanner(
      this.mapAnalyzer,
      this.player.factionType,
      supplyPlanner,
      this.productionValidator,
      this.logisticsManager
    );
    this.adaptiveThresholds = new AdaptiveThresholdManager(this.blackboard, this.basePlanner);
    this.cooldowns.configure("strategyShift", AI_CONFIG.strategyShiftIntervalMs);
    this.cooldowns.configure("analyzeMap", AI_CONFIG.mapAnalysisIntervalMs);
    this.cooldowns.configure("attackTrigger", AI_CONFIG.attackTriggerIntervalMs);
    this.cooldowns.configure("adaptiveThresholds", 500); // as per request
    this.forceMaintenance = new ForceMaintenanceManager(
      this.scene,
      this.player,
      this.blackboard,
      this.logDebugInfo.bind(this),
      this.productionValidator,
      this.adaptiveThresholds
    );
    this.repairManager = new RepairManager(
      this.scene,
      this.player.playerNumber!,
      this.blackboard,
      this.logDebugInfo.bind(this)
    );
    this.logisticsManager = new LogisticsManager(this.blackboard, this.logDebugInfo.bind(this));
    this.techManager = new TechProgressManager(this.blackboard, player.playerNumber!, this.logDebugInfo.bind(this));
    this.economyManager = new EconomyManager(this.blackboard);
    this.worldStateSnapshotManager = new WorldStateSnapshotManager(this.scene, this.player, this.blackboard);
    this.observationPipeline = new AiObservationPipeline(this.scene, this.player, (resourceType) =>
      Math.max(0, (this.blackboard.economy.incomeSmoothed[resourceType] ?? 0) * 60)
    );
    this.combatMicro = new CombatMicroManager(this.scene, this.blackboard, this.logDebugInfo.bind(this));
    this.scoutingManager = new ScoutingManager(this.scene, this.blackboard, this.logDebugInfo.bind(this));
    this.targetingManager = new TargetingManager(this.scene, this.blackboard);
    this.setupDebuggingSubscription();
  }

  /** Returns the bounded immutable trace consumed by the read-only AI debug panel. */
  getDebugSnapshot(): AiDecisionTraceSnapshot {
    return this.decisionTrace.snapshot();
  }

  setPurePlannerOwnsResearch(enabled: boolean): void {
    this.purePlannerOwnsResearch = enabled;
  }

  setPurePlannerOwnsCommands(enabled: boolean): void {
    this.purePlannerOwnsCommands = enabled;
  }

  protected recordDecision(
    action: string,
    outcome: "dispatched" | "failed" | "succeeded",
    reason: AiDecisionReasonCode
  ): void {
    this.decisionTrace.record(action, outcome, reason);
  }

  protected setupDebuggingSubscription() {
    if (!environment.production) {
      const aiDebuggingService = getSceneService(this.scene, DebuggingService)!;
      this.aiDebuggingSubscription = aiDebuggingService.debugChanged.subscribe((debug) => {
        this.displayDebugInfo = debug;
        this.adaptiveThresholds.setLogging(debug);
      });
    }
  }

  /** Documents the pre tick member and its declared contract at this boundary. */
  async preTick(now: number): Promise<void> {
    await this.updateManagers(now);
  }

  /** Returns the last atomically committed fair observation for the future pure-brain adapter. */
  getCommittedObservation() {
    return this.observationPipeline.getObservation();
  }

  /** Returns the runtime-derived capability catalog paired with the committed observation generation. */
  getCommittedCapabilityCatalog() {
    return this.observationPipeline.getCapabilityCatalog();
  }

  /** Saves only player-permitted memory and bounded query cursors, never live actors. */
  getObservationMemoryState() {
    return this.observationPipeline.getState();
  }

  /** Restores fair memory before the next observation rebuilds current live references. */
  setObservationMemoryState(state: Parameters<AiObservationPipeline["setState"]>[0]): void {
    this.observationPipeline.setState(state);
  }

  /** Supplies the debug panel with already committed observation metadata only. */
  getObservationDebugSnapshot() {
    return this.observationPipeline.getDebugSnapshot();
  }

  protected async updateManagers(now: number): Promise<void> {
    const tick = getSceneService(this.scene, SimulationTickService)?.currentTick ?? Math.max(0, Math.floor(now / 50));
    await this.observationPipeline.refresh(tick);
    await this.worldStateSnapshotManager.update(now);
    this.economyManager.update(now);
    // Update scouting vision sampling
    this.scoutingManager.updateVisionSampling(now);
    // Update primary target cache
    await this.targetingManager.update(now);
    if (!this.purePlannerOwnsCommands) this.processPrerequisiteQueue();
    if (this.cooldowns.canRun("adaptiveThresholds", now)) {
      this.adaptiveThresholds.update();
      this.cooldowns.markRun("adaptiveThresholds", now);
    }
  }

  // ===========================================================================
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected logDebugInfo(message?: any, ...optionalParams: any[]) {
    if (!this.displayDebugInfo) return;
    console.log(message, ...optionalParams);
  }

  protected onShutdown() {
    this.aiDebuggingSubscription?.unsubscribe();
  }
  protected abstract processPrerequisiteQueue(): void;
}
