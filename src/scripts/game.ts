import "phaser";
import PreloadScene from "./scenes/logo/preload-scene";
import MainSceneFirst from "./scenes/first/mainSceneFirst";
import MainSceneLogo from "./scenes/logo/main-scene-logo";
import DungeonPreloader from "./scenes/dungeon/scenes/DungeonPreloader";
import Dungeon from "./scenes/dungeon/scenes/Dungeon";
import DungeonUi from "./scenes/dungeon/scenes/DungeonUi";

const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;

// noinspection JSUnusedLocalSymbols
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
const configFirstGame: Phaser.Types.Core.GameConfig = {
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

// noinspection JSUnusedLocalSymbols
const configDungeonGame: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 400,
  height: 250,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: true
    }
  },
  scale: {
    zoom: 2
  },
  scene: [DungeonPreloader, Dungeon, DungeonUi]
};

window.addEventListener("load", () => {
  // noinspection JSUnusedLocalSymbols
  // const game = new Phaser.Game(config);
  // noinspection JSUnusedLocalSymbols
  // const game = new Phaser.Game(configFirstGame);
  // noinspection JSUnusedLocalSymbols
  const game = new Phaser.Game(configDungeonGame);
});
