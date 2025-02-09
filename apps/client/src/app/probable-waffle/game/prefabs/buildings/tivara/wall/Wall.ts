// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "../../../../data/object-names";
import WallTopRightBottomRight from "./WallTopRightBottomRight";
import WallTopRightBottomLeft from "./WallTopRightBottomLeft";
import WallTopLeftBottomRight from "./WallTopLeftBottomRight";
import WallTopLeftBottomLeft from "./WallTopLeftBottomLeft";
import WallEmpty from "./WallEmpty";
import WallTopLeft from "./WallTopLeft";
import WallTopRight from "./WallTopRight";
import WallBottomLeft from "./WallBottomLeft";
import WallBottomRight from "./WallBottomRight";
import { ConstructionHelper } from "../../../../entity/building/construction/construction-helper";
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

    this.foundation = foundation;
    this.cursor = cursor;

    /* START-USER-CTR-CODE */
    this.createWall(WallType.Empty); // todo should be full
    this.setup();
    /* END-USER-CTR-CODE */
  }

  private foundation: Phaser.GameObjects.Image;
  private cursor: Phaser.GameObjects.Image;

  /* START-USER-CODE */
  name = ObjectNames.Wall;

  private wall?: Phaser.GameObjects.GameObject;
  createWall(wallType: WallType) {
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
    }
    this.add(this.wall);
  }

  private setup() {
    new ConstructionHelper(this, this.handlePrefabVisibility.bind(this));
  }

  private adjustWallAccordingToNeighbors() {
    // todo
  }

  private handlePrefabVisibility(progress: number | null) {
    const wall = this.wall as any as Phaser.GameObjects.Container;
    this.cursor.visible = progress === null;
    wall.visible = progress === 100;
    this.foundation.visible = progress !== null && progress < 100;
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
  TopLeft,
  TopRight,
  BottomLeft,
  BottomRight
}
