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

    this.events.emit("scene-awake");
  }

  /* START-USER-CODE */

  // Write your code here

  preload() {
    this.editorCreate();

    this.load.pack("asset-pack", "assets/probable-waffle/asset-packers/asset-pack-probable-waffle.json");
    const map = this.getMap();
    this.load.pack("asset-pack-map", "assets/probable-waffle/asset-packers/maps/" + map.loader.mapLoaderAssetPackPath);
  }

  create() {
    const map = this.getMap();
    this.scene.start(map.loader.mapSceneKey);
  }

  private getMap() {
    const levelId = this.baseGameData.gameInstance.data.gameModeData!.level!;
    const level = ProbableWaffleLevels[levelId];
    return level;
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
