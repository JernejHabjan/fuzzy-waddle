// You can write more code here

/* START OF COMPILED CODE */

import PreloadBarUpdaterScript from "../../../../../shared/game/phaser/script-nodes/PreloadBarUpdaterScript";
/* START-USER-IMPORTS */
import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
/* END-USER-IMPORTS */

export default class PreloadProbableWaffle extends ProbableWaffleScene {
  constructor() {
    super("PreloadProbableWaffle");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {
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
    loadingText.setStyle({ color: "#e0e0e0", fontFamily: "disposabledroid", fontSize: "40px", resolution: 10 });

    this.progressBar = progressBar;
    this.progressBarBg = progressBarBg;
    this.loadingText = loadingText;

    this.events.emit("scene-awake");
  }

  private progressBar!: Phaser.GameObjects.Rectangle;
  private progressBarBg!: Phaser.GameObjects.Rectangle;
  private loadingText!: Phaser.GameObjects.Text;

  /* START-USER-CODE */

  // Write your code here

  override preload() {
    this.editorCreate();
    this.center();
    this.load.pack("asset-pack", "assets/probable-waffle/asset-packers/asset-pack-probable-waffle.json");
    this.load.pack(
      "asset-pack-map",
      "assets/probable-waffle/asset-packers/maps/" + this.mapInfo.loader.mapLoaderAssetPackPath
    );
  }

  center() {
    this.progressBar.x = this.cameras.main.centerX - this.progressBar.width / 2;
    this.progressBar.y = this.cameras.main.centerY - this.progressBar.height / 2;
    this.progressBarBg.x = this.cameras.main.centerX - this.progressBarBg.width / 2;
    this.progressBarBg.y = this.cameras.main.centerY - this.progressBarBg.height / 2;
    // set loading text above progress bar on y
    this.loadingText.x = this.cameras.main.centerX - this.loadingText.width / 2;
    this.loadingText.y = this.progressBar.y - this.loadingText.height - 10;
  }

  override create() {
    this.scene.start(this.mapInfo.loader.mapSceneKey);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
