import { type AIBehaviorTreeStateData, ProbableWafflePlayer } from "@fuzzy-waddle/api-interfaces";
import { PlayerAiBlackboard } from "./player-ai-blackboard";
import { PlayerAiControllerAgent } from "./player-ai-controller.agent";
import { BehaviourTree } from "mistreevous";
import Phaser from "phaser";
import { PlayerAiControllerMdsl } from "./player-ai-controller.mdsl";
import { TelemetrySink } from "./telemetry";
import { AI_CONFIG } from "./ai-config";
import { getSimulationNow } from "./ai-time";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../world/services/simulation-tick.service";
import type { Subscription } from "rxjs";

export class PlayerAiController {
  private static readonly MAX_SCHEDULED_STEPS_PER_RUN = 5;
  readonly playerAiControllerAgent: PlayerAiControllerAgent;
  public blackboard: PlayerAiBlackboard;
  private behaviourTree: BehaviourTree;
  private elapsedTime: number = 0;
  private static readonly AI_ENABLED = true;
  private readonly stepInterval: number = AI_CONFIG.controllerStepIntervalMs;
  telemetry = new TelemetrySink();
  private telemetryFrameModulo = AI_CONFIG.telemetryFrameModulo;
  private tickSubscription?: Subscription;
  private stepInFlight = false;
  private stepQueued = false;
  constructor(
    public readonly scene: Phaser.Scene,
    public readonly player: ProbableWafflePlayer
  ) {
    this.blackboard = new PlayerAiBlackboard(scene);
    this.playerAiControllerAgent = new PlayerAiControllerAgent(this.scene, this.player, this.blackboard);
    this.behaviourTree = new BehaviourTree(PlayerAiControllerMdsl, this.playerAiControllerAgent);
    // expose telemetry snapshot container in diagnostics if absent
    this.blackboard.diagnostics.telemetry = this.telemetry.snapshot();

    const simulationTickService = getSceneService(scene, SimulationTickService);
    if (simulationTickService) {
      this.tickSubscription = simulationTickService.tick$.subscribe(() => {
        this.updateOnSimulationTick().catch((error: unknown) => {
          console.error(error, "Error updating AI on simulation tick");
        });
      });
    } else {
      scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    }
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
  }

  private async update(_: number, delta: number) {
    const deltaWithTimeScale = delta * this.scene.time.timeScale;

    if (!PlayerAiController.AI_ENABLED) return;
    this.elapsedTime += deltaWithTimeScale;
    if (this.elapsedTime >= this.stepInterval) {
      await this.runScheduledStep();
    }
  }

  private async updateOnSimulationTick(): Promise<void> {
    if (!PlayerAiController.AI_ENABLED) return;
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
          this.telemetry.withSpan("ai.behaviourTreeStep", () => this.behaviourTree.step());
          if (this.telemetryFrameModulo && frameBeforeSnapshot % this.telemetryFrameModulo === 0) {
            this.blackboard.diagnostics.telemetry = this.telemetry.snapshot();
          }
        } catch (e) {
          console.log(e, "Error stepping behaviour tree");
          const message = e instanceof Error ? e.message : String(e);
          this.telemetry.recordEvent("bt.error", { message });
        }
        this.elapsedTime = Math.max(0, this.elapsedTime - this.stepInterval);
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
    this.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
    this.tickSubscription?.unsubscribe();
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
      telemetry: this.telemetry.snapshot()
    };
  }

  /**
   * Set the AI behavior tree state from saved data.
   */
  public setSaveState(state: AIBehaviorTreeStateData): void {
    if (state.blackboard) {
      this.blackboard.setData(state.blackboard, this.scene);
    }
  }
}
