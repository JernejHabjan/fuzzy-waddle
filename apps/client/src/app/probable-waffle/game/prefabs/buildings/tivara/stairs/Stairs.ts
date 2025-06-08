// You can write more code here

/* START OF COMPILED CODE */

import StairsTopLeft from "./StairsTopLeft";
/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { ConstructionGameObjectInterfaceComponent } from "../../../../entity/building/construction/construction-game-object-interface-component";
import { onObjectReady } from "../../../../data/game-object-helper";
import { throttle } from "../../../../library/throttle";
import { getNeighboursByTypes } from "../../../../data/tile-map-helpers";
import WatchTower from "../wall/WatchTower";
import { TilemapComponent } from "../../../../scenes/components/tilemap.component";
import Wall from "../wall/Wall";
import StairsTopRight from "./StairsTopRight";
import StairsBottomLeft from "./StairsBottomLeft";
import StairsBottomRight from "./StairsBottomRight";
import { setActorData } from "../../../../data/actor-data";
/* END-USER-IMPORTS */

export default class Stairs extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 48);

    // cursor
    const cursor = scene.add.image(
      0.03889938974372242,
      -0.04250807446052818,
      "factions",
      "buildings/tivara/stairs/stairs_top_left.png"
    );
    cursor.setOrigin(0.5, 0.75);
    cursor.visible = false;
    this.add(cursor);

    // foundation
    const foundation = scene.add.image(0, -8, "factions", "buildings/tivara/wall/foundation/foundation_1.png");
    foundation.setInteractive(
      new Phaser.Geom.Polygon(
        "-0.10106595137152397 71.96885109399099 28.877763874655756 54.4686486665849 63.50182029016887 73.47424485118721 63.31364607051934 84.38834959085982 29.06593809430528 97.56054496632676 0.2752824879275302 84.20017537121029"
      ),
      Phaser.Geom.Polygon.Contains
    );
    foundation.setOrigin(0.5, 0.75);
    foundation.visible = false;
    this.add(foundation);

    // editorStairs
    const editorStairs = new StairsTopLeft(scene, 0.03889938974372242, -0.04250807446052818);
    editorStairs.visible = true;
    this.add(editorStairs);

    this.cursor = cursor;
    this.foundation = foundation;

    /* START-USER-CTR-CODE */
    editorStairs.destroy();
    this.updateStairs(StairsType.TopLeft);
    this.setup();
    /* END-USER-CTR-CODE */
  }

  private cursor: Phaser.GameObjects.Image;
  private foundation: Phaser.GameObjects.Image;

  /* START-USER-CODE */
  name = ObjectNames.Stairs;
  private stairs?: Phaser.GameObjects.GameObject;
  updateStairs(stairsType: StairsType) {
    this.stairs?.destroy();
    const stairClasses = {
      [StairsType.TopLeft]: StairsTopLeft,
      [StairsType.TopRight]: StairsTopRight,
      [StairsType.BottomLeft]: StairsBottomLeft,
      [StairsType.BottomRight]: StairsBottomRight
    };

    const StairsClass = stairClasses[stairsType];

    if (StairsClass) {
      this.stairs = new StairsClass(this.scene, 0, 0);
      this.add(this.stairs);
    } else {
      throw new Error("Stairs type not found");
    }
  }

  private setup() {
    setActorData(
      this,
      [new ConstructionGameObjectInterfaceComponent(this, this.handlePrefabVisibility, this.cursor)],
      []
    );

    onObjectReady(
      this,
      () => {
        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.throttleRedrawStairs, this); // todo remove this later
      },
      this
    );
  }

  private throttleRedrawStairs = throttle(this.refreshStairsType.bind(this), 1000);

  private refreshStairsType() {
    if (!this.active) return;
    const stairsType = this.getStairsTypeAccordingToNeighbors();
    const stairs = this.stairs as any as Phaser.GameObjects.Container;
    if (this.cursor.visible) {
      this.updateCursor(stairsType);
    } else if (stairs.visible) {
      this.updateStairs(stairsType);
    }
  }

  private getStairsTypeAccordingToNeighbors(): StairsType {
    const neighbors = this.neighbors;
    if (!neighbors.topLeft && !neighbors.topRight && !neighbors.bottomLeft && !neighbors.bottomRight) {
      return StairsType.TopLeft;
    } else if (neighbors.topLeft && neighbors.topRight && neighbors.bottomLeft && neighbors.bottomRight) {
      return StairsType.TopLeft;
    } else if (neighbors.topLeft && neighbors.topRight && neighbors.bottomRight && !neighbors.bottomLeft) {
      return StairsType.TopLeft;
    } else if (neighbors.topLeft && neighbors.topRight && !neighbors.bottomRight && !neighbors.bottomLeft) {
      return StairsType.TopLeft;
    } else if (neighbors.topLeft && neighbors.topRight && neighbors.bottomLeft && !neighbors.bottomRight) {
      return StairsType.TopLeft;
    } else if (!neighbors.topLeft && neighbors.topRight && neighbors.bottomLeft && neighbors.bottomRight) {
      return StairsType.BottomRight;
    } else if (!neighbors.topLeft && neighbors.topRight && !neighbors.bottomLeft && neighbors.bottomRight) {
      return StairsType.TopRight;
    } else if (!neighbors.topLeft && neighbors.topRight && neighbors.bottomLeft && !neighbors.bottomRight) {
      return StairsType.TopRight;
    } else if (!neighbors.topLeft && !neighbors.topRight && neighbors.bottomLeft && neighbors.bottomRight) {
      return StairsType.BottomLeft;
    } else if (neighbors.topLeft && !neighbors.topRight && neighbors.bottomLeft && neighbors.bottomRight) {
      return StairsType.TopLeft;
    } else if (neighbors.topLeft && !neighbors.topRight && !neighbors.bottomLeft && neighbors.bottomRight) {
      return StairsType.TopLeft;
    } else if (neighbors.topLeft && !neighbors.topRight && neighbors.bottomLeft && !neighbors.bottomRight) {
      return StairsType.TopLeft;
    } else if (neighbors.bottomRight && !neighbors.topRight && !neighbors.bottomLeft && !neighbors.topLeft) {
      return StairsType.BottomRight;
    } else if (neighbors.topLeft && !neighbors.topRight && !neighbors.bottomLeft && !neighbors.bottomRight) {
      return StairsType.TopLeft;
    } else if (neighbors.bottomLeft && !neighbors.topRight && !neighbors.bottomRight && !neighbors.topLeft) {
      return StairsType.BottomLeft;
    } else if (neighbors.topRight && !neighbors.topLeft && !neighbors.bottomRight && !neighbors.bottomLeft) {
      return StairsType.TopRight;
    } else {
      throw new Error("Stairs type not found");
    }
  }

  private updateCursor(stairsType: StairsType) {
    const stairs = this.cursor as any as Phaser.GameObjects.Image;
    const texturePaths = {
      [StairsType.TopLeft]: "buildings/tivara/stairs/stairs_top_left.png",
      [StairsType.TopRight]: "buildings/tivara/stairs/stairs_top_right.png",
      [StairsType.BottomLeft]: "buildings/tivara/stairs/stairs_bottom_left.png",
      [StairsType.BottomRight]: "buildings/tivara/stairs/stairs_bottom_right.png"
    };

    const texturePath = texturePaths[stairsType];

    if (texturePath) {
      stairs.setTexture("factions", texturePath);
    } else {
      throw new Error("Stairs type not found");
    }
  }

  private handlePrefabVisibility = (progress: number | null) => {
    const stairs = this.stairs as any as Phaser.GameObjects.Container;
    this.cursor.visible = progress === null;
    stairs.visible = progress === 100;
    this.foundation.visible = progress !== null && progress < 100;
  };

  private get neighbors() {
    return getNeighboursByTypes(this, [Wall, WatchTower], TilemapComponent.tileWidth);
  }

  destroy(fromScene?: boolean) {
    this.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.throttleRedrawStairs, this);
    super.destroy(fromScene);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */
export enum StairsType {
  TopLeft,
  TopRight,
  BottomLeft,
  BottomRight
}
