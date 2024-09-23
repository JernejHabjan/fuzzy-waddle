import { PlayerPawnAiControllerMdsl } from "./player-pawn-ai-controller.mdsl";
import { BehaviourTree } from "mistreevous";
import Phaser from "phaser";
import { PawnAiBlackboard } from "../../../../entity/character/ai/pawn-ai-blackboard";
import { PlayerPawnAiControllerAgent } from "./player-pawn-ai-controller.agent";

export class PawnAiController {
  private blackboard: PawnAiBlackboard = new PawnAiBlackboard();
  private playerPawnAiControllerAgent = new PlayerPawnAiControllerAgent(this.gameObject, this.blackboard);
  private behaviourTree: BehaviourTree;
  private elapsedTime: number = 0;
  private readonly stepInterval: number = 1000;
  constructor(private readonly gameObject: Phaser.GameObjects.GameObject) {
    this.behaviourTree = new BehaviourTree(PlayerPawnAiControllerMdsl, this.playerPawnAiControllerAgent);

    gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.onShutdown, this);
  }

  private update(time: number, dt: number) {
    this.elapsedTime += dt;
    if (this.elapsedTime >= this.stepInterval) {
      this.behaviourTree.step();
      this.elapsedTime = 0;
    }
  }

  private onShutdown() {
    this.gameObject.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
  }
}
