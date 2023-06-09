import BaseScene from '../../shared/game/phaser/scene/base.scene';

export class Loader {
  constructor(scene: BaseScene) {
    const progressBar = scene.add.graphics();
    const progressBox = scene.add.graphics();

    const width = scene.cameras.main.width;
    const height = scene.cameras.main.height;
    const progressBarWidth = 320;
    const progressBarHeight = 50;
    const progressBarX = width / 2 - progressBarWidth / 2;
    const progressBarY = height / 2 - progressBarHeight / 2;
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);

    const loadingText = scene.make.text({
      x: width / 2,
      y: height / 2 - progressBarHeight,
      text: 'Loading...',
      style: {
        font: '20px monospace',
        color: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);

    const percentText = scene.make.text({
      x: width / 2,
      y: height / 2,
      text: '0%',
      style: {
        font: '18px monospace',
        color: '#ffffff'
      }
    });
    percentText.setOrigin(0.5, 0.5);

    const assetText = scene.make.text({
      x: width / 2,
      y: height / 2 + 50,
      text: '',
      style: {
        font: '18px monospace',
        color: '#ffffff'
      }
    });
    assetText.setOrigin(0.5, 0.5);

    scene.load.on(Phaser.Loader.Events.PROGRESS, (value: number) => {
      percentText.setText(Math.round(value * 100) + '%');
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(
        progressBarX + 10,
        progressBarY + 10,
        (progressBarWidth - 20) * value,
        progressBarHeight - 20
      );
    });

    scene.load.on(Phaser.Loader.Events.FILE_PROGRESS, (file: Phaser.Loader.File) => {
      assetText.setText('Loading asset: ' + file.key);
    });

    scene.load.on(Phaser.Loader.Events.COMPLETE, function () {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      assetText.destroy();
      scene.load.off(Phaser.Loader.Events.PROGRESS);
      scene.load.off(Phaser.Loader.Events.FILE_PROGRESS);
      scene.load.off(Phaser.Loader.Events.COMPLETE);
    });
  }
}
