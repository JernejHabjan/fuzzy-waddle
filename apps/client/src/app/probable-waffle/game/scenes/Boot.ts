import preloadAssetPackUrl from '../../../../assets/probable-waffle/asset-packers/preload-asset-pack.json';
export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.load.pack('pack', preloadAssetPackUrl as any);
  }

  create() {
    this.scene.start('Preload');
  }
}
