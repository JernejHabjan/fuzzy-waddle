import { CommonModule } from "@angular/common";
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import TivaraMacemanMale from "../../../game/prefabs/characters/tivara/TivaraMacemanMale";
import Phaser from "phaser";
import { baseGameConfig } from "../../../../shared/game/base-game.config";
import { CreateSceneFromObjectConfig } from "../../../../shared/game/phaser/scene/scene-config.interface";
import SkaduweeWorkerFemale from "../../../game/prefabs/characters/skaduwee/SkaduweeWorkerFemale";
import SkaduweeWorkerMale from "../../../game/prefabs/characters/skaduwee/SkaduweeWorkerMale";
import SkaduweeRangedFemale from "../../../game/prefabs/characters/skaduwee/SkaduweeRangedFemale";
import SkaduweeMagicianFemale from "../../../game/prefabs/characters/skaduwee/SkaduweeMagicianFemale";
import SkaduweeWarriorMale from "../../../game/prefabs/characters/skaduwee/SkaduweeWarriorMale";
import Tree1 from "../../../game/prefabs/outside/foliage/trees/resources/Tree1";
import Tree4 from "../../../game/prefabs/outside/foliage/trees/resources/Tree4";
import Tree5 from "../../../game/prefabs/outside/foliage/trees/resources/Tree5";
import Tree6 from "../../../game/prefabs/outside/foliage/trees/resources/Tree6";
import Tree7 from "../../../game/prefabs/outside/foliage/trees/resources/Tree7";
import Tree9 from "../../../game/prefabs/outside/foliage/trees/resources/Tree9";
import Tree10 from "../../../game/prefabs/outside/foliage/trees/resources/Tree10";
import Tree11 from "../../../game/prefabs/outside/foliage/trees/resources/Tree11";
import Minerals from "../../../game/prefabs/outside/resources/Minerals";
import StonePile from "../../../game/prefabs/outside/resources/StonePile";
import GeneralWarrior from "../../../game/prefabs/characters/general/GeneralWarrior";
import TivaraWorkerFemale from "../../../game/prefabs/characters/tivara/TivaraWorkerFemale";
import TivaraWorkerMale from "../../../game/prefabs/characters/tivara/TivaraWorkerMale";
import TivaraSlingshotFemale from "../../../game/prefabs/characters/tivara/TivaraSlingshotFemale";

@Component({
  selector: "probable-waffle-banner",
  imports: [CommonModule],
  template: `<div #gameContainer></div> `
})
export class BannerComponent implements OnInit, OnDestroy {
  @ViewChild("gameContainer", { static: true }) gameContainer!: ElementRef;

  private game!: Phaser.Game;
  ngOnInit(): void {
    this.initializeGame();
  }

  ngOnDestroy(): void {
    if (this.game) {
      this.game.destroy(true);
    }
  }

  private initializeGame(): void {
    const config: Phaser.Types.Core.GameConfig = {
      ...baseGameConfig,
      type: Phaser.AUTO,
      width: 300,
      height: window.innerHeight,
      parent: this.gameContainer.nativeElement,
      transparent: true,
      pixelArt: true,
      scene: BannerScene
    };

    this.game = new Phaser.Game(config);
  }
}

class BannerScene extends Phaser.Scene implements CreateSceneFromObjectConfig {
  private gameObject!: Phaser.GameObjects.Sprite | Phaser.GameObjects.Container;

  constructor() {
    super({ key: "BannerScene" });
  }

  preload = (): void => {
    this.load.pack("asset-pack", "assets/probable-waffle/asset-packers/asset-pack-probable-waffle.json");
  };

  create = () => {
    const constructors = [
      GeneralWarrior,
      TivaraWorkerFemale,
      TivaraWorkerMale,
      TivaraMacemanMale,
      TivaraSlingshotFemale,
      TivaraMacemanMale,
      SkaduweeWorkerMale,
      SkaduweeWorkerFemale,
      SkaduweeRangedFemale,
      SkaduweeMagicianFemale,
      SkaduweeWarriorMale,
      Tree1,
      Tree4,
      Tree5,
      Tree6,
      Tree7,
      Tree9,
      Tree10,
      Tree11,
      Minerals,
      StonePile
    ];
    const randomIndex = Phaser.Math.Between(0, constructors.length - 1);
    const randomConstructor = constructors[randomIndex];

    this.gameObject = new randomConstructor(this, 0, 0) as any;
    this.gameObject.setScale(10);
    if ((this.gameObject as any).setOrigin) (this.gameObject as any).setOrigin(0.5, 0.5);
    this.repositionGameObject();
    this.add.existing(this.gameObject);

    // Start with the sprite invisible and blurred
    this.gameObject.setAlpha(0);
    this.scale.on("resize", this.handleResize, this);

    // add opacity to 1 in 1 second
    this.tweens.add({
      targets: this.gameObject,
      alpha: 1,
      duration: 1000,
      ease: "Power2",
      onComplete: () => {
        // Optionally, you can add a blur effect here if needed
        // this.cameras.main.setPostPipeline(Phaser.Renderer.WebGL.Pipelines.BlurPipeline);
      }
    });

    // Optional: Click interaction
    this.gameObject.on("pointerdown", () => {
      console.log("Game object clicked!");
    });
  };

  private handleResize = () => {
    this.repositionGameObject();
  };

  private repositionGameObject = () => {
    if (this.gameObject) {
      const centerX = this.cameras.main.width / 2;
      const centerY = this.cameras.main.height / 2;
      this.gameObject.setPosition(centerX, centerY);
    }
  };
}
