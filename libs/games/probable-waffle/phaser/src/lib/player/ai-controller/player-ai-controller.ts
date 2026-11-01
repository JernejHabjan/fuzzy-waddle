import { createAiRuntimeBrainHooks } from "./test-support/harness/controls/create-ai-runtime-brain-hooks";
import {
  type AiCommandReconciliationStateData,
  type AIBehaviorTreeStateData,
  FactionType,
  ProbableWaffleAiDifficulty,
  ProbableWafflePlayer
} from "@fuzzy-waddle/probable-waffle-protocol";
import { PlayerAiBlackboard } from "./player-ai-blackboard";
import { PlayerAiControllerAgent } from "./player-ai-controller.agent";
import Phaser from "phaser";
import { TelemetrySink } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/telemetry";
import { AI_CONFIG } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/ai-config";
import { getSimulationNow } from "./decision/ai-time";
import { isSceneActive } from "../../data/game-object-helper";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../world/services/simulation-tick.service";
import { take, type Subscription } from "rxjs";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { CommandBusService } from "../../world/services/multiplayer/command-bus.service";
import { AiCommandReconciliation } from "./outcomes/ai-command-reconciliation";
import type { AiAuthorityState, AiBrainState, AiCommandOutcome } from "@fuzzy-waddle/probable-waffle-gameplay";
import { createAiBrainState } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/state/create-ai-brain-state";
import { migrateAiBrainState } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/persistence/migrate-ai-brain-state";
import { canonicalizeAiBrainState } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/persistence/canonical-ai-serialization";
import { createAiProfileConfig } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/profiles/ai-profile-defaults";
import type { PureAiBrain } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/ai-brain";
import type { AiDebugSnapshot, AiProfileConfig } from "@fuzzy-waddle/probable-waffle-gameplay";
import { selectAiOpeningArchetype } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/profiles/ai-opening-archetypes";
import { readAiRuntimeCalibrationOpening } from "./test-support/browser/ai-runtime-calibration";
import type { AiIntent } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { AiBrainStepResult } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/ai-brain-step-result";
import { dispatchAiIntents } from "./commands/ai-intent-dispatcher";
import { dispatchAiBrainResult } from "./commands/dispatch-ai-brain-result";
import { captureAiDecisionInput } from "./decision/capture-ai-decision-input";
import { beginAiResourceDecision, fenceAiResourceNeed } from "./observation/economy/ai-resource-input-observation";
import type { AiDecisionInput } from "./decision/ai-decision-input";
import { createAiProductionBrain } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/state/create-ai-production-brain";
import { publishAiRuntimeDecisionRepro } from "./test-support/reproduction/ai-runtime-decision-repro";

/** Owns one pure planner, its fixed-tick cadence and the shared command/save boundary. */
export class PlayerAiController {
  private static readonly MAX_SCHEDULED_STEPS_PER_RUN = 5;
  readonly playerAiControllerAgent: PlayerAiControllerAgent;
  public blackboard: PlayerAiBlackboard;
  private elapsedTime = 0;
  private static readonly AI_ENABLED = true;
  private enabled = true;
  private authorityActive = true;
  private disposed = false;
  private readonly stepInterval: number;
  telemetry = new TelemetrySink();
  private telemetryFrameModulo = AI_CONFIG.telemetryFrameModulo;
  private tickSubscription?: Subscription;
  private stepInFlight = false;
  private stepQueued = false;
  private readonly commandReconciliation?: AiCommandReconciliation;
  private brainState?: AiBrainState;
  private readonly profile: AiProfileConfig;
  private readonly pureBrain: PureAiBrain;
  private latestBrainDebug?: AiDebugSnapshot;
  private readonly brainDebugHistory: AiDebugSnapshot[] = [];
  private completedDecisionSequence = 0;
  constructor(
    public readonly scene: ProbableWaffleScene,
    public readonly player: ProbableWafflePlayer
  ) {
    this.profile = this.resolveProfile();
    this.stepInterval =
      (this.profile?.decisionIntervalTicks ??
        AI_CONFIG.controllerStepIntervalMs / SimulationTickService.TICK_INTERVAL_MS) *
      SimulationTickService.TICK_INTERVAL_MS;
    this.pureBrain = createAiProductionBrain(
      this.profile,
      () => this.playerAiControllerAgent?.getCommittedCapabilityCatalog(),
      createAiRuntimeBrainHooks(scene, player.playerNumber)
    );
    this.blackboard = new PlayerAiBlackboard(scene);
    const commandBus = getSceneService(scene, CommandBusService);
    if (commandBus && player.playerNumber !== undefined) {
      this.commandReconciliation = new AiCommandReconciliation(
        player.playerNumber,
        commandBus,
        this.profile?.decisionIntervalTicks
      );
    }
    this.playerAiControllerAgent = new PlayerAiControllerAgent(this.scene, this.player, this.blackboard);
    this.brainState = this.createInitialBrainState();
    // expose telemetry snapshot container in diagnostics if absent
    this.blackboard.diagnostics.telemetry = this.telemetry.snapshot();

    const simulationTickService = getSceneService(scene, SimulationTickService);
    if (simulationTickService) {
      this.tickSubscription = simulationTickService.tick$.subscribe(() => {
        this.commandReconciliation?.observeTick(simulationTickService.currentTick);
        this.updateOnSimulationTick().catch((error: unknown) => {
          console.error(error, "Error updating AI on simulation tick");
        });
      });
    } else {
      // Fallback for environments without SimulationTickService (e.g. isolated tests).
      // Runtime multiplayer must use simulation ticks for deterministic AI cadence.
      scene.events.on(Phaser.Scenes.Events.UPDATE, this.updateFrameNonDeterministicFallback, this);
    }
    this.bindSceneShutdown();
  }

  private bindSceneShutdown(): void {
    // BaseScene emits onShutdown for both Phaser SHUTDOWN and DESTROY paths,
    // including a scene removed directly instead of stopped first.
    this.scene.onShutdown.pipe(take(1)).subscribe(() => this.onShutdown());
  }

  private async updateFrameNonDeterministicFallback(_: number, delta: number) {
    if (!isSceneActive(this.scene)) return;
    const deltaWithTimeScale = delta * this.scene.time.timeScale;

    if (!PlayerAiController.AI_ENABLED || !this.enabled || !this.authorityActive) return;
    this.elapsedTime += deltaWithTimeScale;
    if (this.elapsedTime >= this.stepInterval) {
      await this.runScheduledStep();
    }
  }

  private async updateOnSimulationTick(): Promise<void> {
    if (!isSceneActive(this.scene)) return;
    if (!PlayerAiController.AI_ENABLED || !this.enabled || !this.authorityActive) return;
    this.elapsedTime += SimulationTickService.TICK_INTERVAL_MS;
    if (this.elapsedTime >= this.stepInterval) {
      await this.runScheduledStep();
    }
  }

  private async runScheduledStep(): Promise<void> {
    if (!this.authorityActive || !this.enabled) return;
    if (this.stepInFlight) {
      this.stepQueued = true;
      return;
    }

    this.stepInFlight = true;
    try {
      let processedSteps = 0;
      do {
        this.stepQueued = false;
        this.telemetry.nextFrame();
        const frameBeforeSnapshot = this.telemetry.snapshot().frame;
        try {
          this.telemetry.withSpan("ai.preTick", () =>
            this.playerAiControllerAgent.preparePureDecision(getSimulationNow(this.scene))
          );
          if (!this.authorityActive || !this.enabled) break;
          this.stepDecisionPlanner();
          if (this.telemetryFrameModulo && frameBeforeSnapshot % this.telemetryFrameModulo === 0) {
            this.blackboard.diagnostics.telemetry = this.telemetry.snapshot();
          }
        } catch (e) {
          console.log(e, "Error stepping AI controller");
          const message = e instanceof Error ? e.message : String(e);
          this.telemetry.recordEvent("bt.error", { message });
        }
        this.elapsedTime = Math.max(0, this.elapsedTime - this.stepInterval);
        this.completedDecisionSequence = Math.min(Number.MAX_SAFE_INTEGER, this.completedDecisionSequence + 1);
        processedSteps++;
        if (processedSteps >= PlayerAiController.MAX_SCHEDULED_STEPS_PER_RUN) {
          this.stepQueued = this.stepQueued || this.elapsedTime >= this.stepInterval;
          break;
        }
      } while (this.elapsedTime >= this.stepInterval || this.stepQueued);
    } finally {
      this.stepInFlight = false;
    }

    if (this.stepQueued) {
      Promise.resolve()
        .then(() => this.runScheduledStep())
        .catch((error: unknown) => {
          console.error(error, "Error scheduling next AI step");
        });
    }
  }

  private onShutdown() {
    if (this.disposed) return;
    this.disposed = true;
    this.authorityActive = false;
    this.stepQueued = false;
    fenceAiResourceNeed(this.scene, this.player.playerNumber, "controller_shutdown");
    this.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.updateFrameNonDeterministicFallback, this);
    this.tickSubscription?.unsubscribe();
    this.commandReconciliation?.destroy();
    this.playerAiControllerAgent?.destroy();
    this.brainDebugHistory.length = 0;
  }

  public getTelemetrySnapshot() {
    return this.telemetry.snapshot();
  }

  /**
   * Saves pure state using the existing wire envelope, including compatibility blackboard data.
   */
  public getSaveState(): AIBehaviorTreeStateData {
    return {
      blackboard: this.blackboard.getData(),
      telemetry: this.telemetry.snapshot(),
      deliveredIncomeSampling: this.playerAiControllerAgent.getDeliveredIncomeSamplingState(),
      enabled: this.enabled,
      commandReconciliation: this.commandReconciliation?.getState(),
      observationMemory: this.playerAiControllerAgent.getObservationMemoryState(),
      brainState: this.brainState ? structuredClone(canonicalizeAiBrainState(this.brainState)) : undefined,
      controllerCadence: {
        schemaVersion: 1,
        elapsedMilliseconds: this.elapsedTime,
        queuedAfterBoundary: this.stepQueued,
        completedDecisionSequence: this.completedDecisionSequence
      }
    };
  }

  /**
   * Restores pure state or migrates a blackboard-only save without reviving legacy command execution.
   */
  public setSaveState(state: AIBehaviorTreeStateData): void {
    if (this.disposed) throw new Error("ai_controller_disposed");
    fenceAiResourceNeed(this.scene, this.player.playerNumber, "controller_save_restore");
    this.setEnabled(state.enabled ?? true);
    if (state.blackboard) {
      this.blackboard.setData(state.blackboard, this.scene);
    }
    const clockTick = getSceneService(this.scene, SimulationTickService)?.currentTick ?? 0;
    const saveTick = this.scene.baseGameData.gameInstance.gameState?.data.simulationTick;
    const restoredTick = Math.max(
      clockTick,
      typeof saveTick === "number" && Number.isSafeInteger(saveTick) && saveTick >= 0 ? saveTick : 0
    );
    this.playerAiControllerAgent.restoreDeliveredIncomeSampling(
      state.deliveredIncomeSampling,
      restoredTick * SimulationTickService.TICK_INTERVAL_MS
    );
    if (state.commandReconciliation) {
      const tick = getSceneService(this.scene, SimulationTickService)?.currentTick ?? 0;
      this.commandReconciliation?.setState(state.commandReconciliation, tick);
    }
    if (state.observationMemory) {
      this.playerAiControllerAgent.setObservationMemoryState(state.observationMemory);
    }
    if (state.brainState) {
      const context = this.getBrainMigrationContext();
      if (context)
        this.brainState = structuredClone(canonicalizeAiBrainState(migrateAiBrainState(state.brainState, context)));
    } else {
      const context = this.getBrainMigrationContext();
      if (context) {
        this.brainState = structuredClone(
          canonicalizeAiBrainState(migrateAiBrainState(state, { ...context, legacyOpeningLifecycle: "completed" }))
        );
      }
    }
    if (state.controllerCadence?.schemaVersion === 1) {
      const elapsed = state.controllerCadence.elapsedMilliseconds;
      this.elapsedTime = Number.isFinite(elapsed) && elapsed >= 0 ? Math.min(elapsed, this.stepInterval) : 0;
      this.stepQueued = state.controllerCadence.queuedAfterBoundary === true;
      this.completedDecisionSequence = Number.isSafeInteger(state.controllerCadence.completedDecisionSequence)
        ? Math.max(0, state.controllerCadence.completedDecisionSequence)
        : 0;
    }
  }

  /** Documents the set enabled member and its declared contract at this boundary. */
  setEnabled(enabled: boolean): void {
    if (this.disposed) return;
    if (!enabled) fenceAiResourceNeed(this.scene, this.player.playerNumber, "controller_disabled");
    this.enabled = enabled;
    const definition = this.player.playerController.data.playerDefinition;
    if (definition) definition.campaignAiEnabled = enabled;
  }

  /** Host transfer suspends planning without changing the campaign's persisted AI-enabled policy. */
  setAuthorityActive(active: boolean): void {
    if (this.disposed) return;
    if (!active) fenceAiResourceNeed(this.scene, this.player.playerNumber, "controller_authority_lost");
    this.authorityActive = active;
    if (!active) this.stepQueued = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getCommandReconciliationSnapshot(): AiCommandReconciliationStateData | undefined {
    return this.commandReconciliation?.getState();
  }

  /** Fair observation committed for the current decision and read-only debug UI. */
  getCommittedObservation() {
    return this.playerAiControllerAgent.getCommittedObservation();
  }

  /** Runtime-derived, generation-paired capability catalog. */
  getCommittedCapabilityCatalog() {
    return this.playerAiControllerAgent.getCommittedCapabilityCatalog();
  }

  /** Read-only metadata; panel callers never query the live world for hidden information. */
  getObservationDebugSnapshot() {
    return this.playerAiControllerAgent.getObservationDebugSnapshot();
  }

  /** Committed planner view; callers receive facts captured at the decision boundary only. */
  getBrainDebugSnapshot(): AiDebugSnapshot | undefined {
    return this.latestBrainDebug ? structuredClone(this.latestBrainDebug) : undefined;
  }

  /** Bounded immutable live history; navigating it never pauses or advances the match. */
  getBrainDebugHistory(): readonly AiDebugSnapshot[] {
    return this.brainDebugHistory.map((snapshot) => structuredClone(snapshot));
  }

  /** Explicit text export for developer tooling; callers own any user-initiated file download. */
  exportBrainDebugHistory(): string {
    return JSON.stringify(this.brainDebugHistory);
  }

  /** Read-only projection of the command frontier and delivered outcomes. */
  getBrainCommandBridgeSnapshot():
    | { readonly outcomes: readonly AiCommandOutcome[]; readonly authority: AiAuthorityState }
    | undefined {
    if (!this.commandReconciliation) return undefined;
    return {
      outcomes: this.commandReconciliation.getBrainOutcomes(this.scene.gameInstanceId),
      authority: this.commandReconciliation.getBrainAuthorityState()
    };
  }

  /** True only after asynchronous observation and behavior work has crossed its save-safe boundary. */
  isDecisionBoundarySettled(): boolean {
    return !this.stepInFlight && !this.stepQueued;
  }

  /** Canonical save-owned pure state; callers cannot mutate the live brain. */
  getBrainState(): AiBrainState | undefined {
    return this.brainState ? structuredClone(canonicalizeAiBrainState(this.brainState)) : undefined;
  }

  /** Replaces state only through the checked current migration boundary. */
  setBrainState(state: unknown): void {
    if (this.disposed) throw new Error("ai_controller_disposed");
    fenceAiResourceNeed(this.scene, this.player.playerNumber, "controller_brain_replaced");
    const context = this.getBrainMigrationContext();
    if (!context) throw new Error("ai_brain_identity_unavailable");
    this.brainState = structuredClone(canonicalizeAiBrainState(migrateAiBrainState(state, context)));
  }

  private createInitialBrainState(): AiBrainState | undefined {
    const context = this.getBrainMigrationContext();
    return context ? createAiBrainState(context) : undefined;
  }

  /** Runs the persisted pure planner synchronously against the committed observation. */
  private stepPureBrain(): void {
    const observation = this.playerAiControllerAgent.getCommittedObservation();
    const bridge = this.getBrainCommandBridgeSnapshot();
    if (!observation || !this.brainState || !this.pureBrain) return;
    beginAiResourceDecision(this.scene, this.player.playerNumber, observation);
    // Outcomes can arrive between decisions or synchronously during dispatch. Admission must consume the live frontier.
    const previous = { ...this.brainState, authority: bridge?.authority ?? this.brainState.authority };
    let result: AiBrainStepResult;
    try {
      result = this.pureBrain.step(observation, previous, bridge?.outcomes ?? []);
    } catch (error) {
      this.commandReconciliation?.markTechnicalFault();
      this.brainState = { ...this.brainState, authority: { ...this.brainState.authority, health: "technical_fault" } };
      throw error;
    }
    publishAiRuntimeDecisionRepro(
      this.scene,
      this.profile,
      this.getCommittedCapabilityCatalog(),
      observation,
      previous,
      bridge?.outcomes ?? [],
      result
    );
    this.dispatchAcceptedIntents(result.acceptedIntents, {
      result,
      authority: bridge?.authority ?? result.nextState.authority,
      input: captureAiDecisionInput(
        this.scene,
        observation,
        this.playerAiControllerAgent.getCommittedCapabilityCatalog(),
        this.stepInterval,
        this.completedDecisionSequence,
        this.profile
      )
    });
    this.brainState = structuredClone(
      canonicalizeAiBrainState({
        ...result.nextState,
        authority: this.getBrainCommandBridgeSnapshot()?.authority ?? result.nextState.authority
      })
    );
    this.latestBrainDebug = structuredClone(result.debugSnapshot);
    this.brainDebugHistory.push(structuredClone(result.debugSnapshot));
    const limit = this.profile?.traceHistoryDecisions ?? 128;
    if (this.brainDebugHistory.length > limit) this.brainDebugHistory.splice(0, this.brainDebugHistory.length - limit);
  }

  private stepDecisionPlanner(): void {
    if (this.authorityActive === false) return;
    if (this.pureBrain) {
      this.telemetry.withSpan("ai.pureBrainStep", () => this.stepPureBrain());
      return;
    }
    throw new Error("ai_pure_brain_unavailable");
  }

  /** Routes accepted commands under the host fence; real pure steps also publish their exact accepting result. */
  private dispatchAcceptedIntents(
    intents: readonly AiIntent[],
    decision?: {
      readonly result: AiBrainStepResult;
      readonly authority: AiAuthorityState;
      readonly input?: AiDecisionInput;
    }
  ): void {
    if (this.authorityActive === false || this.player.playerNumber === undefined) return;
    if (decision)
      dispatchAiBrainResult(this.scene, this.player.playerNumber, decision.result, decision.authority, decision.input);
    else dispatchAiIntents(this.scene, this.player.playerNumber, intents);
  }

  private resolveProfile(): AiProfileConfig {
    const definition = this.player.playerController.data.playerDefinition;
    if (
      this.player.playerNumber === undefined ||
      !Number.isSafeInteger(this.player.playerNumber) ||
      this.player.playerNumber < 0
    )
      throw new Error("ai_player_identity_unavailable");
    if (definition?.factionType !== FactionType.Tivara && definition?.factionType !== FactionType.Skaduwee)
      throw new Error("ai_player_faction_unavailable");
    return createAiProfileConfig(definition.difficulty ?? ProbableWaffleAiDifficulty.Medium);
  }

  private getBrainMigrationContext() {
    const playerNumber = this.player.playerNumber;
    const definition = this.player.playerController.data.playerDefinition;
    const faction = definition?.factionType;
    if (playerNumber === undefined || faction === undefined) return undefined;
    const profile =
      this.profile ?? createAiProfileConfig(definition?.difficulty ?? ProbableWaffleAiDifficulty.Medium);
    const archetype = selectAiOpeningArchetype({
      faction,
      playerNumber,
      profile,
      seed: playerNumber
    });
    return {
      playerNumber,
      faction,
      profile,
      tick: getSceneService(this.scene, SimulationTickService)?.currentTick ?? 0,
      archetypeId: readAiRuntimeCalibrationOpening(this.scene, playerNumber, faction) ?? archetype.id,
      satisfiedOpeningStepIds: []
    } as const;
  }
}
