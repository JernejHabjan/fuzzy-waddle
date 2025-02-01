// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import HudProbableWaffle from "../../../../scenes/HudProbableWaffle";
import { ProbableWaffleScene } from "../../../../core/probable-waffle.scene";
import { getPlayer } from "../../../../data/scene-data";
import { getSceneSystem } from "../../../../scenes/components/scene-component-helpers";
import { AiPlayerHandler } from "../../../../scenes/components/ai-player-handler";
/* END-USER-IMPORTS */

export default class AiControllerDebugLabel extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 200.15978001501432, y ?? 0);

    // playerName
    const playerName = scene.add.text(-0.15977986418442924, 6, "", {});
    playerName.setOrigin(1, 0);
    playerName.text = "Player Name";
    playerName.setStyle({ align: "right", maxLines: 1 });
    playerName.setWordWrapWidth(200);
    this.add(playerName);

    // playerAction
    const playerAction = scene.add.text(-0.15977986418442924, 34, "", {});
    playerAction.setOrigin(1, 0);
    playerAction.text = "Player action";
    playerAction.setStyle({ align: "right", maxLines: 1 });
    playerAction.setWordWrapWidth(200);
    this.add(playerAction);

    this.playerName = playerName;
    this.playerAction = playerAction;

    /* START-USER-CTR-CODE */
    this.mainSceneWithActors = (this.scene as HudProbableWaffle).probableWaffleScene!;
    /* END-USER-CTR-CODE */
  }

  private playerName: Phaser.GameObjects.Text;
  private playerAction: Phaser.GameObjects.Text;

  /* START-USER-CODE */
  private readonly mainSceneWithActors: ProbableWaffleScene;
  setPlayer(playerNumber: number) {
    const player = getPlayer(this.mainSceneWithActors, playerNumber);

    if (player) {
      this.playerName.text = "Player " + playerNumber;
      const aiHandlerSystem = getSceneSystem(this.mainSceneWithActors, AiPlayerHandler);
      this.playerAction.text = aiHandlerSystem?.getAiPlayerController(playerNumber)?.blackboard.currentStrategy || "";
    } else {
      this.playerName.text = "No Player";
      this.playerAction.text = "";
    }
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
