// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
import PreloadBarUpdaterScript from "../../../other/Template/script-nodes/PreloadBarUpdaterScript";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class PreloadProbableWaffle extends Phaser.Scene {
  constructor() {
    super("PreloadProbableWaffle");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {
    // guapen
    const guapen = this.add.image(505.0120544433594, 360, "guapen");
    guapen.scaleX = 0.32715486817515643;
    guapen.scaleY = 0.32715486817515643;

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
    this.load.pack("asset-pack-map", map.assetPath);
  }

  create() {
    const map = this.getMap();
    this.scene.start(map.sceneKey);
  }

  getMap(): MapType {
    // eslint-disable-next-line prefer-const
    let mapId = 2; // todo get from somewhere else
    switch (mapId) {
      case 1:
        return {
          sceneKey: "MapRiverCrossing",
          assetPath: "assets/probable-waffle/asset-packers/maps/asset-pack-probable-waffle-river-crossing.json"
        };
      case 2:
        return {
          sceneKey: "MapEmberEnclave",
          assetPath: "assets/probable-waffle/asset-packers/maps/asset-pack-probable-waffle-ember-enclave.json"
        };
      default:
        throw new Error(`Map id ${mapId} not found`);
    }
  }

  /* END-USER-CODE */
}

type MapType = {
  sceneKey: string;
  assetPath: string;
};

/* END OF COMPILED CODE */

// You can write more code here
