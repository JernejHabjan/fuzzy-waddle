import {
  type AiCommandReconciliationStateData,
  type AIBehaviorTreeStateData,
  ProbableWaffleAiDifficulty,
  ProbableWafflePlayer
} from "@fuzzy-waddle/probable-waffle-protocol";
import { PlayerAiBlackboard } from "./player-ai-blackboard";
import { PlayerAiControllerAgent } from "./player-ai-controller.agent";
import { BehaviourTree } from "mistreevous";
import Phaser from "phaser";
import { PlayerAiControllerMdsl } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/player-ai-controller.mdsl";
import { TelemetrySink } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/telemetry";
import { AI_CONFIG } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/ai-config";
import { getSimulationNow } from "./ai-time";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../world/services/simulation-tick.service";
import type { Subscription } from "rxjs";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { CommandBusService } from "../../world/services/multiplayer/command-bus.service";
import { AiCommandReconciliation } from "./ai-command-reconciliation";
import type { AiAuthorityStateV1, AiBrainStateV1, AiCommandOutcomeV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { createAiBrainStateV1 } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/create-ai-brain-state-v1";
import { migrateAiBrainState } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/migrate-ai-brain-state";
import { canonicalizeAiBrainStateV1 } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/canonical-ai-serialization";
import { createAiProfileConfigV1 } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/profiles/ai-profile-defaults";
import { PureAiBrain } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/ai-brain";
import type { AiDebugSnapshotV1, AiProfileConfigV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { AiIntentV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { selectAiOpeningArchetypeV1 } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/profiles/ai-opening-archetypes-v1";
import { AiMacroManager } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/planning/ai-macro-manager";
import { AiTransportManager } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/planning/ai-transport-manager";
import { AiSkirmishManager } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/planning/ai-skirmish-manager";
import { AiBaseManager } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/planning/ai-base-manager";
import { AiFortificationManager } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/planning/ai-fortification-manager";
import { AiRecoveryManager } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/planning/ai-recovery-manager";
import { AiTacticsManager } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/planning/ai-tactics-manager";
import { AiAdaptationManager } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/planning/ai-adaptation-manager";
import { dispatchAiIntents } from "./ai-intent-dispatcher";

export class PlayerAiController {
  private static readonly MAX_SCHEDULED_STEPS_PER_RUN = 5;
  readonly playerAiControllerAgent: PlayerAiControllerAgent;
  public blackboard: PlayerAiBlackboard;
  private behaviourTree: BehaviourTree;
  private elapsedTime: number = 0;
  private static readonly AI_ENABLED = true;
  private enabled = true;
  private readonly stepInterval: number;
  telemetry = new TelemetrySink();
  private telemetryFrameModulo = AI_CONFIG.telemetryFrameModulo;
  private tickSubscription?: Subscription;
  private stepInFlight = false;
  private stepQueued = false;
  private readonly commandReconciliation?: AiCommandReconciliation;
  private brainState?: AiBrainStateV1;
  private readonly profile: AiProfileConfigV1 | undefined;
  private readonly pureBrain: PureAiBrain | undefined;
  private latestBrainDebug?: AiDebugSnapshotV1;
  private readonly brainDebugHistory: AiDebugSnapshotV1[] = [];
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
    this.pureBrain = this.profile
      ? new PureAiBrain(this.profile, [
          new AiMacroManager(() => this.playerAiControllerAgent?.getCommittedCapabilityCatalog()),
          new AiTransportManager(() => this.playerAiControllerAgent?.getCommittedCapabilityCatalog()),
          new AiSkirmishManager(this.profile, () => this.playerAiControllerAgent?.getCommittedCapabilityCatalog()),
          new AiBaseManager(this.profile, () => this.playerAiControllerAgent?.getCommittedCapabilityCatalog()),
          new AiFortificationManager(this.profile, () => this.playerAiControllerAgent?.getCommittedCapabilityCatalog()),
          new AiRecoveryManager(() => this.playerAiControllerAgent?.getCommittedCapabilityCatalog()),
          new AiTacticsManager(this.profile, () => this.playerAiControllerAgent?.getCommittedCapabilityCatalog()),
          new AiAdaptationManager(this.profile, () => this.playerAiControllerAgent?.getCommittedCapabilityCatalog())
        ])
      : undefined;
    this.blackboard = new PlayerAiBlackboard(scene);
    const commandBus = getSceneService(scene, CommandBusService);
    if (commandBus && player.playerNumber !== undefined) {
      this.commandReconciliation = new AiCommandReconciliation(player.playerNumber, commandBus);
    }
    this.playerAiControllerAgent = new PlayerAiControllerAgent(this.scene, this.player, this.blackboard);
    this.playerAiControllerAgent.setPurePlannerOwnsCommands(this.pureBrain !== undefined);
    this.playerAiControllerAgent.setPurePlannerOwnsResearch(this.pureBrain !== undefined);
    this.brainState = this.createInitialBrainState();
    this.behaviourTree = new BehaviourTree(PlayerAiControllerMdsl, this.playerAiControllerAgent);
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
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
  }

  private async updateFrameNonDeterministicFallback(_: number, delta: number) {
    const deltaWithTimeScale = delta * this.scene.time.timeScale;

    if (!PlayerAiController.AI_ENABLED || !this.enabled) return;
    this.elapsedTime += deltaWithTimeScale;
    if (this.elapsedTime >= this.stepInterval) {
      await this.runScheduledStep();
    }
  }

  private async updateOnSimulationTick(): Promise<void> {
    if (!PlayerAiController.AI_ENABLED || !this.enabled) return;
    this.elapsedTime += SimulationTickService.TICK_INTERVAL_MS;
    if (this.elapsedTime >= this.stepInterval) {
      await this.runScheduledStep();
    }
  }

  private async runScheduledStep(): Promise<void> {
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
          await this.telemetry.withSpanAsync(
            "ai.preTick",
            async () => await this.playerAiControllerAgent.preTick(getSimulationNow(this.scene))
          );
          this.stepDecisionPlanner();
          if (this.telemetryFrameModulo && frameBeforeSnapshot % this.telemetryFrameModulo === 0) {
            this.blackboard.diagnostics.telemetry = this.telemetry.snapshot();
          }
        } catch (e) {
          console.log(e, "Error stepping behaviour tree");
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
    this.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.updateFrameNonDeterministicFallback, this);
    this.tickSubscription?.unsubscribe();
    this.commandReconciliation?.destroy();
    this.brainDebugHistory.length = 0;
  }

  public getTelemetrySnapshot() {
    return this.telemetry.snapshot();
  }

  /**
   * Get the AI behavior tree state for saving.
   */
  public getSaveState(): AIBehaviorTreeStateData {
    return {
      blackboard: this.blackboard.getData(),
      telemetry: this.telemetry.snapshot(),
      enabled: this.enabled,
      commandReconciliation: this.commandReconciliation?.getState(),
      observationMemory: this.playerAiControllerAgent.getObservationMemoryState(),
      brainState: this.brainState ? structuredClone(canonicalizeAiBrainStateV1(this.brainState)) : undefined,
      controllerCadence: {
        schemaVersion: 1,
        elapsedMilliseconds: this.elapsedTime,
        queuedAfterBoundary: this.stepQueued,
        completedDecisionSequence: this.completedDecisionSequence
      }
    };
  }

  /**
   * Set the AI behavior tree state from saved data.
   */
  public setSaveState(state: AIBehaviorTreeStateData): void {
    this.setEnabled(state.enabled ?? true);
    if (state.blackboard) {
      this.blackboard.setData(state.blackboard, this.scene);
    }
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
        this.brainState = structuredClone(canonicalizeAiBrainStateV1(migrateAiBrainState(state.brainState, context)));
    } else {
      const context = this.getBrainMigrationContext();
      if (context) {
        this.brainState = structuredClone(
          canonicalizeAiBrainStateV1(migrateAiBrainState(state, { ...context, legacyOpeningLifecycle: "completed" }))
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
    this.enabled = enabled;
    const definition = this.player.playerController.data.playerDefinition;
    if (definition) definition.campaignAiEnabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getCommandReconciliationSnapshot(): AiCommandReconciliationStateData | undefined {
    return this.commandReconciliation?.getState();
  }

  /** Stage 4 fair observation consumed by the later pure brain and current read-only debug UI. */
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

  /** Stage 6 committed planner view; callers receive facts captured at the decision boundary only. */
  getBrainDebugSnapshot(): AiDebugSnapshotV1 | undefined {
    return this.latestBrainDebug ? structuredClone(this.latestBrainDebug) : undefined;
  }

  /** Bounded immutable live history; navigating it never pauses or advances the match. */
  getBrainDebugHistory(): readonly AiDebugSnapshotV1[] {
    return this.brainDebugHistory.map((snapshot) => structuredClone(snapshot));
  }

  /** Explicit text export for developer tooling; callers own any user-initiated file download. */
  exportBrainDebugHistory(): string {
    return JSON.stringify(this.brainDebugHistory);
  }

  /** Read-only Stage 3 adapter consumed when the pure brain becomes live in Stage 6. */
  getBrainCommandBridgeSnapshot():
    | { readonly outcomes: readonly AiCommandOutcomeV1[]; readonly authority: AiAuthorityStateV1 }
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

  /** Canonical save-owned pure state prepared for Stage 6 live adoption and Stage 5 replay. */
  getBrainState(): AiBrainStateV1 | undefined {
    return this.brainState ? structuredClone(canonicalizeAiBrainStateV1(this.brainState)) : undefined;
  }

  /** Replaces state only through the checked V1 migration boundary. */
  setBrainState(state: unknown): void {
    const context = this.getBrainMigrationContext();
    if (!context) throw new Error("ai_brain_identity_unavailable");
    this.brainState = structuredClone(canonicalizeAiBrainStateV1(migrateAiBrainState(state, context)));
  }

  private createInitialBrainState(): AiBrainStateV1 | undefined {
    const context = this.getBrainMigrationContext();
    return context ? createAiBrainStateV1(context) : undefined;
  }

  /** Runs the persisted pure planner at the same boundary as transitional legacy execution. */
  /** Stage 15 makes the two planners exclusive so legacy commands cannot conflict with accepted pure intents. */
  private stepPureBrain(): void {
    const observation = this.playerAiControllerAgent.getCommittedObservation();
    const bridge = this.getBrainCommandBridgeSnapshot();
    if (!observation || !this.brainState || !this.pureBrain) return;
    const result = this.pureBrain.step(observation, this.brainState, bridge?.outcomes ?? []);
    this.dispatchAcceptedIntents(result.acceptedIntents);
    this.brainState = structuredClone(
      canonicalizeAiBrainStateV1({
        ...result.nextState,
        authority: bridge?.authority ?? result.nextState.authority
      })
    );
    this.latestBrainDebug = structuredClone(result.debugSnapshot);
    this.brainDebugHistory.push(structuredClone(result.debugSnapshot));
    const limit = this.profile?.traceHistoryDecisions ?? 128;
    if (this.brainDebugHistory.length > limit) this.brainDebugHistory.splice(0, this.brainDebugHistory.length - limit);
  }

  private stepDecisionPlanner(): void {
    if (this.pureBrain) {
      this.telemetry.withSpan("ai.pureBrainStep", () => this.stepPureBrain());
      return;
    }
    this.telemetry.withSpan("ai.behaviourTreeStep", () => this.behaviourTree.step());
  }

  /** Translates accepted macro and transport intents through the shared player command authority. */
  /** Stage 13 also routes accepted tactical attack, recovery, healing and manual spell intents here. */
  private dispatchAcceptedIntents(intents: readonly AiIntentV1[]): void {
    if (this.player.playerNumber === undefined) return;
    dispatchAiIntents(this.scene, this.player.playerNumber, intents);
  }

  private resolveProfile(): AiProfileConfigV1 | undefined {
    const definition = this.player.playerController.data.playerDefinition;
    if (this.player.playerNumber === undefined || definition?.factionType === undefined) return undefined;
    return createAiProfileConfigV1(definition.difficulty ?? ProbableWaffleAiDifficulty.Medium);
  }

  private getBrainMigrationContext() {
    const playerNumber = this.player.playerNumber;
    const definition = this.player.playerController.data.playerDefinition;
    const faction = definition?.factionType;
    if (playerNumber === undefined || faction === undefined) return undefined;
    const profile =
      this.profile ?? createAiProfileConfigV1(definition?.difficulty ?? ProbableWaffleAiDifficulty.Medium);
    const archetype = selectAiOpeningArchetypeV1({
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
      archetypeId: archetype.id,
      satisfiedOpeningStepIds: []
    } as const;
  }
}
