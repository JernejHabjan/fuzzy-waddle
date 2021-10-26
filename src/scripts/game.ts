import "phaser";
import PreloadScene from "./scenes/logo/preload-scene";
import MainSceneFirst from "./scenes/first/mainSceneFirst";
import MainSceneLogo from "./scenes/logo/main-scene-logo";

const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  backgroundColor: "#ffffff",
  scale: {
    parent: "phaser-game",
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT
  },
  scene: [PreloadScene, MainSceneLogo],
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
      gravity: { y: 400 }
    }
  }
};

// noinspection JSUnusedLocalSymbols
const configFirstGame = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false
    }
  },
  scene: [MainSceneFirst]
};

window.addEventListener("load", () => {
  // noinspection JSUnusedLocalSymbols
  const game = new Phaser.Game(config);
  // const game = new Phaser.Game(configFirstGame);
});
