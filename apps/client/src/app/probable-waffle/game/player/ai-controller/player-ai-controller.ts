import { type AIBehaviorTreeStateData, ProbableWafflePlayer } from "@fuzzy-waddle/api-interfaces";
import { PlayerAiBlackboard } from "./player-ai-blackboard";
import { PlayerAiControllerAgent } from "./player-ai-controller.agent";
import { BehaviourTree } from "mistreevous";
import Phaser from "phaser";
import { PlayerAiControllerMdsl } from "./player-ai-controller.mdsl";
import { TelemetrySink } from "./telemetry";
import { AI_CONFIG } from "./ai-config";

export class PlayerAiController {
  readonly playerAiControllerAgent: PlayerAiControllerAgent;
  public blackboard: PlayerAiBlackboard;
  private behaviourTree: BehaviourTree;
  private elapsedTime: number = 0;
  private static readonly AI_ENABLED = false; // todo
  private readonly stepInterval: number = AI_CONFIG.controllerStepIntervalMs;
  telemetry = new TelemetrySink();
  private telemetryFrameModulo = AI_CONFIG.telemetryFrameModulo;
  constructor(
    public readonly scene: Phaser.Scene,
    public readonly player: ProbableWafflePlayer
  ) {
    this.blackboard = new PlayerAiBlackboard(scene);
    this.playerAiControllerAgent = new PlayerAiControllerAgent(this.scene, this.player, this.blackboard);
    this.behaviourTree = new BehaviourTree(PlayerAiControllerMdsl, this.playerAiControllerAgent);
    // expose telemetry snapshot container in diagnostics if absent
    this.blackboard.diagnostics.telemetry = this.telemetry.snapshot();

    scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
  }

  private async update(_: number, delta: number) {
    const deltaWithTimeScale = delta * this.scene.time.timeScale;

    if (!PlayerAiController.AI_ENABLED) return;
    this.elapsedTime += deltaWithTimeScale;
    if (this.elapsedTime >= this.stepInterval) {
      this.telemetry.nextFrame();
      const frameBeforeSnapshot = this.telemetry.snapshot().frame; // capture frame index
      try {
        await this.telemetry.withSpanAsync(
          "ai.preTick",
          async () => await this.playerAiControllerAgent.preTick(performance.now())
        );
        this.telemetry.withSpan("ai.behaviourTreeStep", () => this.behaviourTree.step());
        if (this.telemetryFrameModulo && frameBeforeSnapshot % this.telemetryFrameModulo === 0) {
          this.blackboard.diagnostics.telemetry = this.telemetry.snapshot();
        }
      } catch (e) {
        console.log(e, "Error stepping behaviour tree");
        this.telemetry.recordEvent("bt.error", { message: (e as any)?.message });
      }
      this.elapsedTime = 0;
    }
  }

  private onShutdown() {
    this.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
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
