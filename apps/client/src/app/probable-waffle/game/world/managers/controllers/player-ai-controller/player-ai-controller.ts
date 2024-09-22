import { ProbableWafflePlayer } from "@fuzzy-waddle/api-interfaces";
import { PlayerAiBlackboard } from "../../../../entity/character/ai/player-ai/player-ai-blackboard";
import { PlayerAiControllerAgent } from "./player-ai-controller.agent";
import { BehaviourTree } from "mistreevous";
import Phaser from "phaser";
import { PlayerAiControllerMdsl } from "./player-ai-controller.mdsl";

export class PlayerAiController {
  private blackboard: PlayerAiBlackboard = new PlayerAiBlackboard();
  private playerAiControllerAgent = new PlayerAiControllerAgent(this.blackboard);
  private behaviourTree: BehaviourTree;
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: ProbableWafflePlayer
  ) {
    this.behaviourTree = new BehaviourTree(PlayerAiControllerMdsl, this.playerAiControllerAgent);

    scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
  }

  private update(time: number, dt: number) {
    this.behaviourTree.step();
  }

  private onShutdown() {
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
  }
}
