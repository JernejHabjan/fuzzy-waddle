// You can write more code here

/* START OF COMPILED CODE */

import TempleCursor from "./Temple/TempleCursor";
import TempleFoundation1 from "./Temple/TempleFoundation1";
import TempleFoundation2 from "./Temple/TempleFoundation2";
import TempleLevel1 from "./Temple/TempleLevel1";
/* START-USER-IMPORTS */
import { ObjectNames } from "../../../data/object-names";
import { ConstructionGameObjectInterfaceComponent } from "../../../entity/building/construction/construction-game-object-interface-component";
import { setActorData } from "../../../data/actor-data";
/* END-USER-IMPORTS */

export default class Temple extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 96.3076677868738, y ?? 132.66656040978646);

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-87.4233523303501 -76.75060092556245 -16.50738820893966 -110.3423734041253 -8.36392821413655 -103.21684590867258 0.11884261378335736 -107.28857590607413 10.298167607287255 -101.52029174308859 19.459560101440744 -108.98513007165812 87.32172672479999 -74.71473592686168 87.66103755791679 10.791594018571004 0.45815344690015536 53.544758991287324 -89.11990649593407 9.095039852987014"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // templeCursor
    const templeCursor = new TempleCursor(scene, 0, -8);
    templeCursor.visible = false;
    this.add(templeCursor);

    // templeFoundation1
    const templeFoundation1 = new TempleFoundation1(scene, 0, -8);
    templeFoundation1.visible = false;
    this.add(templeFoundation1);

    // templeFoundation2
    const templeFoundation2 = new TempleFoundation2(scene, 0, -8);
    templeFoundation2.visible = false;
    this.add(templeFoundation2);

    // templeLevel1
    const templeLevel1 = new TempleLevel1(scene, 0, -8);
    this.add(templeLevel1);

    this.templeCursor = templeCursor;
    this.templeFoundation1 = templeFoundation1;
    this.templeFoundation2 = templeFoundation2;
    this.templeLevel1 = templeLevel1;

    /* START-USER-CTR-CODE */
    this.setup();
    /* END-USER-CTR-CODE */
  }

  private templeCursor: TempleCursor;
  private templeFoundation1: TempleFoundation1;
  private templeFoundation2: TempleFoundation2;
  private templeLevel1: TempleLevel1;

  /* START-USER-CODE */
  name = ObjectNames.Temple;
  private setup() {
    setActorData(
      this,
      [new ConstructionGameObjectInterfaceComponent(this, this.handlePrefabVisibility, this.templeCursor)],
      []
    );
  }

  private handlePrefabVisibility = (progress: number | null) => {
    this.templeCursor.visible = progress === null;
    this.templeLevel1.visible = progress === 100;
    this.templeFoundation1.visible = progress !== null && progress < 50;
    this.templeFoundation2.visible = progress !== null && progress >= 50 && progress < 100;
    if (this.templeLevel1.visible) {
      this.templeLevel1.start();
    }
  };

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
