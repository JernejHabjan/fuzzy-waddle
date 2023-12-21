// You can write more code here

/* START OF COMPILED CODE */

import PreloadBarUpdaterScript from "../../../other/Template/script-nodes/PreloadBarUpdaterScript";
/* START-USER-IMPORTS */
import {
  ProbableWaffleGameMode,
  ProbableWaffleGameModeData,
  ProbableWaffleGameState,
  ProbableWaffleGameStateData,
  ProbableWaffleLevels,
  ProbableWafflePlayer,
  ProbableWafflePlayerControllerData,
  ProbableWafflePlayerStateData,
  ProbableWaffleSpectator,
  ProbableWaffleSpectatorData
} from "@fuzzy-waddle/api-interfaces";
import { BaseScene } from "../../../shared/game/phaser/scene/base.scene";
import { ProbableWaffleGameData } from "./probable-waffle-game-data";
/* END-USER-IMPORTS */

export default class PreloadProbableWaffle extends BaseScene<
  ProbableWaffleGameData,
  ProbableWaffleGameStateData,
  ProbableWaffleGameState,
  ProbableWaffleGameModeData,
  ProbableWaffleGameMode,
  ProbableWafflePlayerStateData,
  ProbableWafflePlayerControllerData,
  ProbableWafflePlayer,
  ProbableWaffleSpectatorData,
  ProbableWaffleSpectator
> {
  constructor() {
    super("PreloadProbableWaffle");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {
    // probable-waffle-loader
    const probable_waffle_loader = this.add.image(505.0120544433594, 360, "probable-waffle-loader");
    probable_waffle_loader.scaleX = 2;
    probable_waffle_loader.scaleY = 2;

    // progressBar
    const progressBar = this.add.rectangle(553.0120849609375, 361, 256, 20);
    progressBar.setOrigin(0, 0);
    progressBar.isFilled = true;
    progressBar.fillColor = 14737632;

    // preloadUpdater
    new PreloadBarUpdaterScript(progressBar);

    // progressBarBg
    const progressBarBg = this.add.rectangle(553.0120849609375, 361, 256, 20);
    progressBarBg.setOrigin(0, 0);
    progressBarBg.fillColor = 14737632;
    progressBarBg.isStroked = true;

    // loadingText
    const loadingText = this.add.text(552.0120849609375, 329, "", {});
    loadingText.text = "Loading...";
    loadingText.setStyle({ color: "#e0e0e0", fontFamily: "arial", fontSize: "20px" });

    // probable-waffle-loader_1
    const probable_waffle_loader_1 = this.add.image(847, 364, "probable-waffle-loader");
    probable_waffle_loader_1.scaleX = 2;
    probable_waffle_loader_1.scaleY = 2;

    this.probable_waffle_loader = probable_waffle_loader;
    this.progressBar = progressBar;
    this.progressBarBg = progressBarBg;
    this.loadingText = loadingText;
    this.probable_waffle_loader_1 = probable_waffle_loader_1;

    this.events.emit("scene-awake");
  }

  private probable_waffle_loader!: Phaser.GameObjects.Image;
  private progressBar!: Phaser.GameObjects.Rectangle;
  private progressBarBg!: Phaser.GameObjects.Rectangle;
  private loadingText!: Phaser.GameObjects.Text;
  private probable_waffle_loader_1!: Phaser.GameObjects.Image;

  /* START-USER-CODE */

  // Write your code here

  preload() {
    this.editorCreate();
    this.center();
    this.load.pack("asset-pack", "assets/probable-waffle/asset-packers/asset-pack-probable-waffle.json");
    const map = this.getMap();
    this.load.pack("asset-pack-map", "assets/probable-waffle/asset-packers/maps/" + map.loader.mapLoaderAssetPackPath);
  }

  center() {
    this.progressBar.x = this.cameras.main.centerX - this.progressBar.width / 2;
    this.progressBar.y = this.cameras.main.centerY - this.progressBar.height / 2;
    this.progressBarBg.x = this.cameras.main.centerX - this.progressBarBg.width / 2;
    this.progressBarBg.y = this.cameras.main.centerY - this.progressBarBg.height / 2;
    // set loading text above progress bar on y
    this.loadingText.x = this.cameras.main.centerX - this.loadingText.width / 2;
    this.loadingText.y = this.progressBar.y - this.loadingText.height - 10;
    // set probable_waffle_loader left of progress bar on x
    this.probable_waffle_loader.x = this.progressBar.x - this.probable_waffle_loader.width - 10;
    this.probable_waffle_loader.y = this.cameras.main.centerY;
    // set probable_waffle_loader_1 right of progress bar on x
    this.probable_waffle_loader_1.x =
      this.progressBar.x + this.progressBar.width + 10 + this.probable_waffle_loader_1.width;
    this.probable_waffle_loader_1.y = this.cameras.main.centerY;
  }

  create() {
    const map = this.getMap();
    this.scene.start(map.loader.mapSceneKey);
  }

  private getMap() {
    const levelId = this.baseGameData.gameInstance.data.gameModeData!.map!;
    const level = ProbableWaffleLevels[levelId];
    return level;
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
