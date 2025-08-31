import { ProbableWafflePlayer } from "@fuzzy-waddle/api-interfaces";
import { PlayerAiBlackboard } from "./player-ai-blackboard";
import { PlayerAiControllerAgent } from "./player-ai-controller.agent";
import { BehaviourTree } from "mistreevous";
import Phaser from "phaser";
import { PlayerAiControllerMdsl } from "./player-ai-controller.mdsl";

export class PlayerAiController {
  private readonly playerAiControllerAgent: PlayerAiControllerAgent;
  public blackboard: PlayerAiBlackboard = new PlayerAiBlackboard();
  private behaviourTree: BehaviourTree;
  private elapsedTime: number = 0;
  private readonly stepInterval: number = 1000;
  constructor(
    public readonly scene: Phaser.Scene,
    public readonly player: ProbableWafflePlayer
  ) {
    this.playerAiControllerAgent = new PlayerAiControllerAgent(this.scene, this.player, this.blackboard);
    this.behaviourTree = new BehaviourTree(PlayerAiControllerMdsl, this.playerAiControllerAgent);

    scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
  }

  private update(time: number, dt: number) {
    this.elapsedTime += dt;
    if (this.elapsedTime >= this.stepInterval) {
      try {
        this.behaviourTree.step();
      } catch (e) {
        console.log(e, "Error stepping behaviour tree");
      }
      this.elapsedTime = 0;
    }
  }

  private onShutdown() {
    this.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
  }
}
