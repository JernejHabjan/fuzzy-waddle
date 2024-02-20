// You can write more code here

/* START OF COMPILED CODE */

import ButtonSmall from "../prefabs/gui/buttons/ButtonSmall";
/* START-USER-IMPORTS */
import { ProbableWaffleScene } from "../core/probable-waffle.scene";
import { HudGameState } from "../hud/hud-game-state";
import { HudElementVisibilityHandler } from "../hud/hud-element-visibility.handler";
import { CursorHandler } from "../world/managers/controllers/input/cursor.handler";
import { MultiSelectionHandler } from "../world/managers/controllers/input/multi-selection.handler";
import { Subscription } from "rxjs";
import { GameSessionState } from "@fuzzy-waddle/api-interfaces";
import { SaveGame } from "../data/save-game";
/* END-USER-IMPORTS */

export default class HudProbableWaffle extends ProbableWaffleScene {
  constructor() {
    super("HudProbableWaffle");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {
    // buttonSave
    const buttonSave = new ButtonSmall(this, 1180, 38);
    this.add.existing(buttonSave);

    // buttonQuit
    const buttonQuit = new ButtonSmall(this, 1201, 38);
    this.add.existing(buttonQuit);

    // lists
    const hudElements: Array<any> = [];

    // buttonSave (prefab fields)
    buttonSave.text = "S";
    buttonSave.w = 45;
    buttonSave.h = 45;
    buttonSave.fontSize = 30;

    // buttonQuit (prefab fields)
    buttonQuit.text = "Q";
    buttonQuit.w = 45;
    buttonQuit.h = 45;
    buttonQuit.fontSize = 30;

    this.buttonSave = buttonSave;
    this.buttonQuit = buttonQuit;
    this.hudElements = hudElements;

    this.events.emit("scene-awake");
  }

  private buttonSave!: ButtonSmall;
  private buttonQuit!: ButtonSmall;
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
    this.handleButtonVisibility();
  }

  private resize(gameSize: { height: number; width: number }) {
    this.cameras.resize(gameSize.width, gameSize.height);
    this.updatePositionOfUiElements();
  }

  private updatePositionOfUiElements() {
    // push button to top right (margin 40px)
    this.buttonQuit.x = this.scale.width - this.buttonQuit.w - 40;
    this.buttonQuit.y = 40;

    // set save button to the left of quit button by 20px
    this.buttonSave.x = this.buttonQuit.x - this.buttonSave.w - 40;
    this.buttonSave.y = this.buttonQuit.y;
  }

  private handleQuit() {
    this.quitButtonSubscription = this.buttonQuit.clicked.subscribe(() => {
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
    this.saveGameSubscription = this.buttonSave.clicked.subscribe(() => {
      this.communicator.allScenes.emit({ name: "save-game" });
    });
  }

  destroy() {
    this.quitButtonSubscription?.unsubscribe();
    this.saveGameSubscription?.unsubscribe();
    super.destroy();
  }
  get isVisibleSaveButton() {
    return !this.baseGameData.gameInstance.gameInstanceMetadata.isReplay();
  }

  private handleButtonVisibility() {
    const saveButtonVisibile = this.isVisibleSaveButton;
    this.buttonSave.visible = saveButtonVisibile;
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
