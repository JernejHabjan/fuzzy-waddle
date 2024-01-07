// You can write more code here

/* START OF COMPILED CODE */

import ButtonLarge from "../prefabs/gui/buttons/ButtonLarge";
import ButtonSmall from "../prefabs/gui/buttons/ButtonSmall";
/* START-USER-IMPORTS */
import { ProbableWaffleScene } from "../core/probable-waffle.scene";
import { HudGameState } from "../hud/hud-game-state";
import { HudElementVisibilityHandler } from "../hud/hud-element-visibility.handler";
import { CursorHandler } from "../world/managers/controllers/input/cursor.handler";
import { MultiSelectionHandler } from "../world/managers/controllers/input/multi-selection.handler";
import { Subscription } from "rxjs";
import { GameSessionState } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class HudProbableWaffle extends ProbableWaffleScene {
  constructor() {
    super("HudProbableWaffle");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {
    // buttonLarge
    const buttonLarge = new ButtonLarge(this, 1226, 40);
    this.add.existing(buttonLarge);
    buttonLarge.scaleX = 3;
    buttonLarge.scaleY = 3;

    // buttonSmall
    const buttonSmall = new ButtonSmall(this, 1180, 38);
    this.add.existing(buttonSmall);

    // lists
    const hudElements: Array<any> = [];

    this.buttonLarge = buttonLarge;
    this.buttonSmall = buttonSmall;
    this.hudElements = hudElements;

    this.events.emit("scene-awake");
  }

  private buttonLarge!: ButtonLarge;
  private buttonSmall!: ButtonSmall;
  private hudElements!: Array<any>;

  /* START-USER-CODE */
  private quitButtonSubscription?: Subscription;
  private saveGameSubscription?: Subscription;
  preload() {
    this.load.pack("asset-pack-gui", "assets/probable-waffle/asset-packers/asset-pack-probable-waffle-gui.json");
  }

  create() {
    this.editorCreate();

    // resize the scene to match the screen size
    this.scale.on("resize", this.resize, this);
    this.resize({ height: this.scale.height, width: this.scale.width });

    new CursorHandler(this);
    new HudGameState(this);
    new HudElementVisibilityHandler(this, this.hudElements);
    new MultiSelectionHandler(this);
    this.handleQuit();
    this.handleSaveGame();
  }

  private resize(gameSize: { height: number; width: number }) {
    this.cameras.resize(gameSize.width, gameSize.height);
    this.updatePositionOfUiElements();
  }

  private updatePositionOfUiElements() {
    // push button to top right (margin 40px)
    this.buttonLarge.x = this.scale.width - this.buttonLarge.width - 40;
    this.buttonLarge.y = 40;
  }

  private handleQuit() {
    this.quitButtonSubscription = this.buttonLarge.clicked.subscribe(() => {
      // todo rather than this, change the player state session state to "to score screen" because only 1 player quits
      this.communicator.gameInstanceMetadataChanged?.send({
        property: "sessionState",
        gameInstanceId: this.baseGameData.gameInstance.gameInstanceMetadata.data.gameInstanceId!,
        data: { sessionState: GameSessionState.ToScoreScreen },
        emitterUserId: this.baseGameData.user.userId
      });
    });
  }

  private handleSaveGame() {
    this.saveGameSubscription = this.buttonSmall.clicked.subscribe(() => {
      this.communicator.saveGame.emit();
    });
  }

  destroy() {
    this.quitButtonSubscription?.unsubscribe();
    this.saveGameSubscription?.unsubscribe();
    super.destroy();
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
