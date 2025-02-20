// You can write more code here

/* START OF COMPILED CODE */

import WallTopRightBottomLeft from "./WallTopRightBottomLeft";
/* START-USER-IMPORTS */
import { ObjectNames } from "../../../../data/object-names";
import WallTopRightBottomRight from "./WallTopRightBottomRight";
import WallTopLeftBottomRight from "./WallTopLeftBottomRight";
import WallTopLeftBottomLeft from "./WallTopLeftBottomLeft";
import WallEmpty from "./WallEmpty";
import WallTopLeft from "./WallTopLeft";
import WallTopRight from "./WallTopRight";
import WallBottomLeft from "./WallBottomLeft";
import WallBottomRight from "./WallBottomRight";
import { ConstructionHelper } from "../../../../entity/building/construction/construction-helper";
import WallBottomLeftBottomRight from "./WallBottomLeftBottomRight";
import WallTopLeftTopRight from "./WallTopLeftTopRight";
import WallFull from "./WallFull";
import WallTopLeftBottomRightBottomLeft from "./WallTopLeftBottomRightBottomLeft";
import WallTopLeftTopRightBottomRight from "./WallTopLeftTopRightBottomRight";
import WallBottomLeftBottomRightTopRight from "./WallBottomLeftBottomRightTopRight";
import WallBottomLeftTopLeftTopRight from "./WallBottomLeftTopLeftTopRight";
import { onObjectReady } from "../../../../data/game-object-helper";
import WatchTower from "./WatchTower";
import StairsLeft from "./StairsLeft";
import StairsRight from "./StairsRight";
/* END-USER-IMPORTS */

export default class Wall extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 80.06815881041706);

    this.blendMode = Phaser.BlendModes.SKIP_CHECK;

    // foundation
    const foundation = scene.add.image(0, 0, "factions", "buildings/tivara/wall/foundation/foundation_1.png");
    foundation.setInteractive(
      new Phaser.Geom.Polygon(
        "-0.9934205307175148 83.52408318472752 -0.6619106331295725 70.26368728120998 27.51643066184519 51.69913301628543 63.31949960134254 71.92123676914967 62.656479806166665 83.52408318472752 28.510960354609008 97.115988985833"
      ),
      Phaser.Geom.Polygon.Contains
    );
    foundation.setOrigin(0.5, 0.8352819626557144);
    foundation.visible = false;
    this.add(foundation);

    // cursor
    const cursor = scene.add.image(0, 0, "factions", "buildings/tivara/wall/wall_top_right_bottom_left.png");
    cursor.setOrigin(0.5, 0.8352819626557144);
    cursor.visible = false;
    this.add(cursor);

    // editorWall
    const editorWall = new WallTopRightBottomLeft(scene, 0, 0);
    this.add(editorWall);

    this.foundation = foundation;
    this.cursor = cursor;

    /* START-USER-CTR-CODE */
    editorWall.destroy();
    this.updateWall(WallType.Full);
    this.setup();
    /* END-USER-CTR-CODE */
  }

  private foundation: Phaser.GameObjects.Image;
  private cursor: Phaser.GameObjects.Image;

  /* START-USER-CODE */
  name = ObjectNames.Wall;

  private wall?: Phaser.GameObjects.GameObject;

  updateWall(wallType: WallType) {
    this.wall?.destroy();
    switch (wallType) {
      case WallType.TopRightBottomRight:
        this.wall = new WallTopRightBottomRight(this.scene, 0, 0);
        break;
      case WallType.TopRightBottomLeft:
        this.wall = new WallTopRightBottomLeft(this.scene, 0, 0);
        break;
      case WallType.TopLeftBottomRight:
        this.wall = new WallTopLeftBottomRight(this.scene, 0, 0);
        break;
      case WallType.TopLeftBottomLeft:
        this.wall = new WallTopLeftBottomLeft(this.scene, 0, 0);
        break;
      case WallType.Empty:
        this.wall = new WallEmpty(this.scene, 0, 0);
        break;
      case WallType.TopLeft:
        this.wall = new WallTopLeft(this.scene, 0, 0);
        break;
      case WallType.TopRight:
        this.wall = new WallTopRight(this.scene, 0, 0);
        break;
      case WallType.BottomLeft:
        this.wall = new WallBottomLeft(this.scene, 0, 0);
        break;
      case WallType.BottomRight:
        this.wall = new WallBottomRight(this.scene, 0, 0);
        break;
      case WallType.TopLeftTopRight:
        this.wall = new WallTopLeftTopRight(this.scene, 0, 0);
        break;
      case WallType.BottomLeftBottomRight:
        this.wall = new WallBottomLeftBottomRight(this.scene, 0, 0);
        break;
      case WallType.Full:
        this.wall = new WallFull(this.scene, 0, 0);
        break;
      case WallType.TopLeftBottomRightBottomLeft:
        this.wall = new WallTopLeftBottomRightBottomLeft(this.scene, 0, 0);
        break;
      case WallType.TopLeftTopRightBottomRight:
        this.wall = new WallTopLeftTopRightBottomRight(this.scene, 0, 0);
        break;
      case WallType.BottomLeftBottomRightTopRight:
        this.wall = new WallBottomLeftBottomRightTopRight(this.scene, 0, 0);
        break;
      case WallType.BottomLeftTopLeftTopRight:
        this.wall = new WallBottomLeftTopLeftTopRight(this.scene, 0, 0);
        break;
      default:
        throw new Error("Wall type not found");
    }
    this.add(this.wall);
  }

  private setup() {
    new ConstructionHelper(this, this.handlePrefabVisibility.bind(this));

    onObjectReady(
      this,
      () => {
        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.refreshWallType, this); // todo remove this later
      },
      this
    );
  }

  private refreshWallType() {
    if (!this.active) return;
    const wallType = this.getWallTypeAccordingToNeighbors();
    if (this.cursor.visible) {
      this.updateCursor(wallType);
    } else if (this.wall) {
      this.updateWall(wallType);
    }
  }

  private getWallTypeAccordingToNeighbors(): WallType {
    const neighbors = this.neighbors;
    if (!neighbors.topLeft && !neighbors.topRight && !neighbors.bottomLeft && !neighbors.bottomRight) {
      return WallType.Full;
    } else if (neighbors.topLeft && neighbors.topRight && neighbors.bottomLeft && neighbors.bottomRight) {
      return WallType.Empty;
    } else if (neighbors.topLeft && neighbors.topRight && neighbors.bottomRight && !neighbors.bottomLeft) {
      return WallType.BottomLeft;
    } else if (neighbors.topLeft && neighbors.topRight && !neighbors.bottomRight && !neighbors.bottomLeft) {
      return WallType.BottomLeftBottomRight;
    } else if (neighbors.topLeft && neighbors.topRight && neighbors.bottomLeft && !neighbors.bottomRight) {
      return WallType.BottomRight;
    } else if (!neighbors.topLeft && neighbors.topRight && neighbors.bottomLeft && neighbors.bottomRight) {
      return WallType.TopLeft;
    } else if (!neighbors.topLeft && neighbors.topRight && !neighbors.bottomLeft && neighbors.bottomRight) {
      return WallType.TopLeftBottomLeft;
    } else if (!neighbors.topLeft && neighbors.topRight && neighbors.bottomLeft && !neighbors.bottomRight) {
      return WallType.TopLeftBottomRight;
    } else if (!neighbors.topLeft && !neighbors.topRight && neighbors.bottomLeft && neighbors.bottomRight) {
      return WallType.TopLeftTopRight;
    } else if (neighbors.topLeft && !neighbors.topRight && neighbors.bottomLeft && neighbors.bottomRight) {
      return WallType.TopRight;
    } else if (neighbors.topLeft && !neighbors.topRight && !neighbors.bottomLeft && neighbors.bottomRight) {
      return WallType.TopRightBottomLeft;
    } else if (neighbors.topLeft && !neighbors.topRight && neighbors.bottomLeft && !neighbors.bottomRight) {
      return WallType.TopRightBottomRight;
    } else if (neighbors.bottomRight && !neighbors.topRight && !neighbors.bottomLeft && !neighbors.topLeft) {
      return WallType.BottomLeftTopLeftTopRight;
    } else if (neighbors.topLeft && !neighbors.topRight && !neighbors.bottomLeft && !neighbors.bottomRight) {
      return WallType.BottomLeftBottomRightTopRight;
    } else if (neighbors.bottomLeft && !neighbors.topRight && !neighbors.bottomRight && !neighbors.topLeft) {
      return WallType.TopLeftTopRightBottomRight;
    } else if (neighbors.topRight && !neighbors.topLeft && !neighbors.bottomRight && !neighbors.bottomLeft) {
      return WallType.TopLeftBottomRightBottomLeft;
    } else {
      throw new Error("Wall type not found");
    }
  }

  private updateCursor(wallType: WallType) {
    const wall = this.cursor as any as Phaser.GameObjects.Image;
    switch (wallType) {
      case WallType.TopRightBottomRight:
        wall.setTexture("factions", "buildings/tivara/wall/wall_top_right_bottom_right.png");
        break;
      case WallType.TopRightBottomLeft:
        wall.setTexture("factions", "buildings/tivara/wall/wall_top_right_bottom_left.png");
        break;
      case WallType.TopLeftBottomRight:
        wall.setTexture("factions", "buildings/tivara/wall/wall_top_left_bottom_right.png");
        break;
      case WallType.TopLeftBottomLeft:
        wall.setTexture("factions", "buildings/tivara/wall/wall_top_left_bottom_left.png");
        break;
      case WallType.Empty:
        wall.setTexture("factions", "buildings/tivara/wall/wall_empty.png");
        break;
      case WallType.TopLeft:
        wall.setTexture("factions", "buildings/tivara/wall/wall_top_left.png");
        break;
      case WallType.TopRight:
        wall.setTexture("factions", "buildings/tivara/wall/wall_top_right.png");
        break;
      case WallType.BottomLeft:
        wall.setTexture("factions", "buildings/tivara/wall/wall_bottom_left.png");
        break;
      case WallType.BottomRight:
        wall.setTexture("factions", "buildings/tivara/wall/wall_bottom_right.png");
        break;
      case WallType.TopLeftTopRight:
        wall.setTexture("factions", "buildings/tivara/wall/wall_top_left_top_right.png");
        break;
      case WallType.BottomLeftBottomRight:
        wall.setTexture("factions", "buildings/tivara/wall/wall_bottom_left_bottom_right.png");
        break;
      case WallType.Full:
        wall.setTexture("factions", "buildings/tivara/wall/wall_full.png");
        break;
      case WallType.TopLeftBottomRightBottomLeft:
        wall.setTexture("factions", "buildings/tivara/wall/wall_top_left_bottom_right_bottom_left.png");
        break;
      case WallType.TopLeftTopRightBottomRight:
        wall.setTexture("factions", "buildings/tivara/wall/wall_top_left_top_right_bottom_right.png");
        break;
      case WallType.BottomLeftBottomRightTopRight:
        wall.setTexture("factions", "buildings/tivara/wall/wall_bottom_left_bottom_right_top_right.png");
        break;
      case WallType.BottomLeftTopLeftTopRight:
        wall.setTexture("factions", "buildings/tivara/wall/wall_bottom_left_top_left_top_right.png");
        break;
      default:
        throw new Error("Wall type not found");
    }
  }

  private handlePrefabVisibility(progress: number | null) {
    const wall = this.wall as any as Phaser.GameObjects.Container;
    this.cursor.visible = progress === null;
    wall.visible = progress === 100;
    this.foundation.visible = progress !== null && progress < 100;
  }

  private get neighbors(): {
    topLeft: boolean;
    topRight: boolean;
    bottomLeft: boolean;
    bottomRight: boolean;
  } {
    const neighbourTypes = [Wall, WatchTower, StairsLeft, StairsRight];

    const tileWidth = 64;
    const tileHeight = tileWidth / 2;

    const allWalls = this.scene.children.list.filter(
      (child) => child !== this && neighbourTypes.some((type) => child instanceof type)
    ) as Wall[];

    const topLeftWall = allWalls.find(
      (wall) => wall.x === this.x - tileWidth / 2 && wall.y === this.y - tileHeight / 2
    );
    const topRightWall = allWalls.find(
      (wall) => wall.x === this.x + tileWidth / 2 && wall.y === this.y - tileHeight / 2
    );
    const bottomLeftWall = allWalls.find(
      (wall) => wall.x === this.x - tileWidth / 2 && wall.y === this.y + tileHeight / 2
    );
    const bottomRightWall = allWalls.find(
      (wall) => wall.x === this.x + tileWidth / 2 && wall.y === this.y + tileHeight / 2
    );

    return {
      topLeft: !!topLeftWall,
      topRight: !!topRightWall,
      bottomLeft: !!bottomLeftWall,
      bottomRight: !!bottomRightWall
    };
  }

  destroy(fromScene?: boolean) {
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.refreshWallType, this);
    super.destroy(fromScene);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

export enum WallType {
  TopRightBottomRight,
  TopRightBottomLeft,
  TopLeftBottomRight,
  TopLeftBottomLeft,
  Empty,
  Full,
  TopLeft,
  TopRight,
  BottomLeft,
  BottomRight,
  TopLeftTopRight,
  BottomLeftBottomRight,
  BottomLeftTopLeftTopRight,
  BottomLeftBottomRightTopRight,
  TopLeftTopRightBottomRight,
  TopLeftBottomRightBottomLeft
}
