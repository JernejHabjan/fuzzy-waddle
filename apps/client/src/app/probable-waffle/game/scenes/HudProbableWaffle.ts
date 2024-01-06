// You can write more code here

/* START OF COMPILED CODE */

import ButtonSmall from "../prefabs/gui/buttons/ButtonSmall";
/* START-USER-IMPORTS */
import { ProbableWaffleScene } from "../core/probable-waffle.scene";
import { HudGameState } from "../hud/hud-game-state";
import { HudElementVisibilityHandler } from "../hud/hud-element-visibility.handler";
import { CursorHandler } from "../world/managers/controllers/input/cursor.handler";
import { MultiSelectionHandler } from "../world/managers/controllers/input/multi-selection.handler";
/* END-USER-IMPORTS */

export default class HudProbableWaffle extends ProbableWaffleScene {
  constructor() {
    super("HudProbableWaffle");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {
    // buttonSmall
    const buttonSmall = new ButtonSmall(this, 1232, 40);
    this.add.existing(buttonSmall);
    buttonSmall.scaleX = 2;
    buttonSmall.scaleY = 2;

    // lists
    const hudElements = [buttonSmall];

    this.buttonSmall = buttonSmall;
    this.hudElements = hudElements;

    this.events.emit("scene-awake");
  }

  private buttonSmall!: ButtonSmall;
  private hudElements!: ButtonSmall[];

  /* START-USER-CODE */

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
  }

  private resize(gameSize: { height: number; width: number }) {
    this.cameras.resize(gameSize.width, gameSize.height);
    this.updatePositionOfUiElements();
  }

  private updatePositionOfUiElements() {
    // push button to top right (margin 40px)
    this.buttonSmall.x = this.scale.width - this.buttonSmall.width - 40;
    this.buttonSmall.y = 40;
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
