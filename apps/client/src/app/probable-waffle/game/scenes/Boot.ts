export class Boot extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    this.load.pack("pack", "assets/probable-waffle/asset-packers/preload-asset-pack.json");
  }

  create() {
    this.scene.start("PreloadProbableWaffle");
  }
}
