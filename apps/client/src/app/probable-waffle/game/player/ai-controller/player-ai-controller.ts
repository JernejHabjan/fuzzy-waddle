import { ProbableWafflePlayer } from "@fuzzy-waddle/api-interfaces";
import { PlayerAiBlackboard } from "./player-ai-blackboard";
import { PlayerAiControllerAgent } from "./player-ai-controller.agent";
import { BehaviourTree } from "mistreevous";
import Phaser from "phaser";
import { PlayerAiControllerMdsl } from "./player-ai-controller.mdsl";
import { TelemetrySink } from "./telemetry";
import { AI_CONFIG } from "./ai-config";

export class PlayerAiController {
  readonly playerAiControllerAgent: PlayerAiControllerAgent;
  public blackboard: PlayerAiBlackboard = new PlayerAiBlackboard();
  private behaviourTree: BehaviourTree;
  private elapsedTime: number = 0;
  private static readonly AI_ENABLED = true;
  private readonly stepInterval: number = AI_CONFIG.controllerStepIntervalMs;
  telemetry = new TelemetrySink();
  private telemetryFrameModulo = AI_CONFIG.telemetryFrameModulo;
  constructor(
    public readonly scene: Phaser.Scene,
    public readonly player: ProbableWafflePlayer
  ) {
    this.playerAiControllerAgent = new PlayerAiControllerAgent(this.scene, this.player, this.blackboard);
    this.behaviourTree = new BehaviourTree(PlayerAiControllerMdsl, this.playerAiControllerAgent);
    // expose telemetry snapshot container in diagnostics if absent
    this.blackboard.diagnostics.telemetry = this.telemetry.snapshot();

    scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
  }

  private update(time: number, dt: number) {
    if (!PlayerAiController.AI_ENABLED) return;
    this.elapsedTime += dt;
    if (this.elapsedTime >= this.stepInterval) {
      this.telemetry.nextFrame();
      const frameBeforeSnapshot = this.telemetry.snapshot().frame; // capture frame index
      try {
        this.telemetry.withSpan("ai.preTick", () => this.playerAiControllerAgent.preTick(performance.now()));
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
}
