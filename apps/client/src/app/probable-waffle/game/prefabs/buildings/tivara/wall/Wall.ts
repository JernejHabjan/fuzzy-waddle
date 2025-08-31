// You can write more code here

/* START OF COMPILED CODE */

import WallTopRightBottomLeft from "./WallTopRightBottomLeft";
/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import WallTopRightBottomRight from "./WallTopRightBottomRight";
import WallTopLeftBottomRight from "./WallTopLeftBottomRight";
import WallTopLeftBottomLeft from "./WallTopLeftBottomLeft";
import WallEmpty from "./WallEmpty";
import WallTopLeft from "./WallTopLeft";
import WallTopRight from "./WallTopRight";
import WallBottomLeft from "./WallBottomLeft";
import WallBottomRight from "./WallBottomRight";
import { ConstructionGameObjectInterfaceComponent } from "../../../../entity/building/construction/construction-game-object-interface-component";
import WallBottomLeftBottomRight from "./WallBottomLeftBottomRight";
import WallTopLeftTopRight from "./WallTopLeftTopRight";
import WallFull from "./WallFull";
import WallTopLeftBottomRightBottomLeft from "./WallTopLeftBottomRightBottomLeft";
import WallTopLeftTopRightBottomRight from "./WallTopLeftTopRightBottomRight";
import WallBottomLeftBottomRightTopRight from "./WallBottomLeftBottomRightTopRight";
import WallBottomLeftTopLeftTopRight from "./WallBottomLeftTopLeftTopRight";
import { onObjectReady } from "../../../../data/game-object-helper";
import WatchTower from "./WatchTower";
import { throttle } from "../../../../library/throttle";
import Stairs from "../stairs/Stairs";
import { getNeighboursByTypes } from "../../../../data/tile-map-helpers";
import { TilemapComponent } from "../../../../world/components/tilemap.component";
import { setActorData } from "../../../../data/actor-data";
import { getActorComponent } from "../../../../data/actor-component";
import { WalkableComponent, type WalkablePath } from "../../../../entity/actor/components/walkable-component";
/* END-USER-IMPORTS */

export default class Wall extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 80.06815881041706);

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
    const cursor = scene.add.image(0, -8, "factions", "buildings/tivara/wall/wall_top_right_bottom_left.png");
    cursor.setOrigin(0.5, 0.8352819626557144);
    cursor.visible = false;
    this.add(cursor);

    // editorWall
    const editorWall = new WallTopRightBottomLeft(scene, 0, -8);
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
  private currentWallType?: WallType;
  updateWall(wallType: WallType) {
    if (this.currentWallType === wallType) return;
    this.currentWallType = wallType;
    this.wall?.destroy();

    const wallClasses = {
      [WallType.TopRightBottomRight]: WallTopRightBottomRight,
      [WallType.TopRightBottomLeft]: WallTopRightBottomLeft,
      [WallType.TopLeftBottomRight]: WallTopLeftBottomRight,
      [WallType.TopLeftBottomLeft]: WallTopLeftBottomLeft,
      [WallType.Empty]: WallEmpty,
      [WallType.TopLeft]: WallTopLeft,
      [WallType.TopRight]: WallTopRight,
      [WallType.BottomLeft]: WallBottomLeft,
      [WallType.BottomRight]: WallBottomRight,
      [WallType.TopLeftTopRight]: WallTopLeftTopRight,
      [WallType.BottomLeftBottomRight]: WallBottomLeftBottomRight,
      [WallType.Full]: WallFull,
      [WallType.TopLeftBottomLeftBottomRight]: WallTopLeftBottomRightBottomLeft,
      [WallType.TopLeftTopRightBottomRight]: WallTopLeftTopRightBottomRight,
      [WallType.TopRightBottomLeftBottomRight]: WallBottomLeftBottomRightTopRight,
      [WallType.TopLeftTopRightBottomLeft]: WallBottomLeftTopLeftTopRight
    };

    const WallClass = wallClasses[wallType];

    if (WallClass) {
      this.wall = new WallClass(this.scene, 0, 0);
      this.add(this.wall);
    } else {
      throw new Error("Wall type not found");
    }

    const walkableComponent = getActorComponent(this, WalkableComponent);
    if (walkableComponent) {
      const walkablePath = this.getWalkablePath(wallType);
      walkableComponent.allowWalkablePath(walkablePath);
    }
  }

  private getWalkablePath(wallType: WallType): WalkablePath {
    switch (wallType) {
      case WallType.TopRightBottomRight:
        return { topLeft: true, left: true, bottomLeft: true };
      case WallType.TopRightBottomLeft:
        return { topLeft: true, bottomRight: true };
      case WallType.TopLeftBottomRight:
        return { topRight: true, bottomLeft: true };
      case WallType.TopLeftBottomLeft:
        return { topRight: true, right: true, bottomRight: true };
      case WallType.Empty:
        return {
          top: true,
          bottom: true,
          left: true,
          right: true,
          topLeft: true,
          topRight: true,
          bottomLeft: true,
          bottomRight: true
        };
      case WallType.Full:
        return {};
      case WallType.TopLeft:
        return { topRight: true, right: true, bottomRight: true, bottom: true, bottomLeft: true };
      case WallType.TopRight:
        return { topLeft: true, left: true, bottomLeft: true, bottom: true, bottomRight: true };
      case WallType.BottomLeft:
        return { topLeft: true, top: true, topRight: true, right: true, bottomRight: true };
      case WallType.BottomRight:
        return { topRight: true, top: true, topLeft: true, left: true, bottomLeft: true };
      case WallType.TopLeftTopRight:
        return { bottomLeft: true, bottom: true, bottomRight: true };
      case WallType.BottomLeftBottomRight:
        return { topRight: true, top: true, topLeft: true };
      case WallType.TopLeftTopRightBottomLeft:
        return { bottomRight: true };
      case WallType.TopRightBottomLeftBottomRight:
        return { topLeft: true };
      case WallType.TopLeftTopRightBottomRight:
        return { bottomLeft: true };
      case WallType.TopLeftBottomLeftBottomRight:
        return { topRight: true };
      default:
        return {};
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
        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.throttleRedrawWalls, this); // todo remove this later
      },
      this
    );
  }

  private throttleRedrawWalls = throttle(this.refreshWallType.bind(this), 1000);

  private refreshWallType() {
    if (!this.active) return;
    const wallType = this.getWallTypeAccordingToNeighbors();
    const wall = this.wall as any as Phaser.GameObjects.Container;
    if (this.cursor.visible) {
      this.updateCursor(wallType);
    } else if (wall.visible) {
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
      return WallType.TopLeftTopRightBottomLeft;
    } else if (neighbors.topLeft && !neighbors.topRight && !neighbors.bottomLeft && !neighbors.bottomRight) {
      return WallType.TopRightBottomLeftBottomRight;
    } else if (neighbors.bottomLeft && !neighbors.topRight && !neighbors.bottomRight && !neighbors.topLeft) {
      return WallType.TopLeftTopRightBottomRight;
    } else if (neighbors.topRight && !neighbors.topLeft && !neighbors.bottomRight && !neighbors.bottomLeft) {
      return WallType.TopLeftBottomLeftBottomRight;
    } else {
      throw new Error("Wall type not found");
    }
  }

  private updateCursor(wallType: WallType) {
    const wall = this.cursor as any as Phaser.GameObjects.Image;
    const texturePaths = {
      [WallType.TopRightBottomRight]: "buildings/tivara/wall/wall_top_right_bottom_right.png",
      [WallType.TopRightBottomLeft]: "buildings/tivara/wall/wall_top_right_bottom_left.png",
      [WallType.TopLeftBottomRight]: "buildings/tivara/wall/wall_top_left_bottom_right.png",
      [WallType.TopLeftBottomLeft]: "buildings/tivara/wall/wall_top_left_bottom_left.png",
      [WallType.Empty]: "buildings/tivara/wall/wall_empty.png",
      [WallType.TopLeft]: "buildings/tivara/wall/wall_top_left.png",
      [WallType.TopRight]: "buildings/tivara/wall/wall_top_right.png",
      [WallType.BottomLeft]: "buildings/tivara/wall/wall_bottom_left.png",
      [WallType.BottomRight]: "buildings/tivara/wall/wall_bottom_right.png",
      [WallType.TopLeftTopRight]: "buildings/tivara/wall/wall_top_left_top_right.png",
      [WallType.BottomLeftBottomRight]: "buildings/tivara/wall/wall_bottom_left_bottom_right.png",
      [WallType.Full]: "buildings/tivara/wall/wall_full.png",
      [WallType.TopLeftBottomLeftBottomRight]: "buildings/tivara/wall/wall_top_left_bottom_right_bottom_left.png",
      [WallType.TopLeftTopRightBottomRight]: "buildings/tivara/wall/wall_top_left_top_right_bottom_right.png",
      [WallType.TopRightBottomLeftBottomRight]: "buildings/tivara/wall/wall_bottom_left_bottom_right_top_right.png",
      [WallType.TopLeftTopRightBottomLeft]: "buildings/tivara/wall/wall_bottom_left_top_left_top_right.png"
    };

    const texturePath = texturePaths[wallType];

    if (texturePath) {
      wall.setTexture("factions", texturePath);
    } else {
      throw new Error("Wall type not found");
    }
  }

  private handlePrefabVisibility = (progress: number | null) => {
    const wall = this.wall as any as Phaser.GameObjects.Container;
    this.cursor.visible = progress === null;
    wall.visible = progress === 100;
    this.foundation.visible = progress !== null && progress < 100;
  };

  private get neighbors() {
    return getNeighboursByTypes(this, [Wall, WatchTower, Stairs], TilemapComponent.tileWidth);
  }

  destroy(fromScene?: boolean) {
    this.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.throttleRedrawWalls, this);
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
  TopLeftTopRightBottomLeft,
  TopRightBottomLeftBottomRight,
  TopLeftTopRightBottomRight,
  TopLeftBottomLeftBottomRight
}
