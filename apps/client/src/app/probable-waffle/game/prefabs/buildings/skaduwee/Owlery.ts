// You can write more code here

/* START OF COMPILED CODE */

import OwleryCursor from "./Owlery/OwleryCursor";
import OwleryFoundation1 from "./Owlery/OwleryFoundation1";
import OwleryFoundation2 from "./Owlery/OwleryFoundation2";
import OwleryLevel1 from "./Owlery/OwleryLevel1";
/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { ConstructionGameObjectInterfaceComponent } from "../../../entity/building/construction/construction-game-object-interface-component";
import { setActorData } from "../../../data/actor-data";
/* END-USER-IMPORTS */

export default class Owlery extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 176);

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-29.198913756532136 -132.13554367686658 -29.393053965807688 -151.14078501381945 -19.073855503242058 -165.58766286141133 1.0485814987609317 -172.81110178520728 21.686978423892192 -164.8137229767189 30.20031715550884 -150.36684512912703 30.45829711707298 -133.34016766589374 26.008798018194 -123.10624502212163 25.82529643447679 4.115500961156727 20.519498822728373 11.61680103293898 10.456779214239987 14.910054722989713 -8.387950234383709 15.093013261325865 -21.926882071258987 9.60425711124131 -25.22013576130973 3.749583884484423 -24.81325440994174 -123.10624502212163"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // owleryCursor
    const owleryCursor = new OwleryCursor(scene, 0, 0);
    owleryCursor.visible = false;
    this.add(owleryCursor);

    // owleryFoundation1
    const owleryFoundation1 = new OwleryFoundation1(scene, 0, 0);
    owleryFoundation1.visible = false;
    this.add(owleryFoundation1);

    // owleryFoundation2
    const owleryFoundation2 = new OwleryFoundation2(scene, 0, 0);
    owleryFoundation2.visible = false;
    this.add(owleryFoundation2);

    // owleryLevel1
    const owleryLevel1 = new OwleryLevel1(scene, 0, 0);
    this.add(owleryLevel1);

    this.owleryCursor = owleryCursor;
    this.owleryFoundation1 = owleryFoundation1;
    this.owleryFoundation2 = owleryFoundation2;
    this.owleryLevel1 = owleryLevel1;

    /* START-USER-CTR-CODE */
    this.setup();
    /* END-USER-CTR-CODE */
  }

  private owleryCursor: OwleryCursor;
  private owleryFoundation1: OwleryFoundation1;
  private owleryFoundation2: OwleryFoundation2;
  private owleryLevel1: OwleryLevel1;

  /* START-USER-CODE */
  override name = ObjectNames.Owlery;
  private setup() {
    setActorData(
      this,
      [new ConstructionGameObjectInterfaceComponent(this, this.handlePrefabVisibility, this.owleryCursor)],
      []
    );
  }

  private handlePrefabVisibility = (progress: number | null) => {
    this.owleryCursor.visible = progress === null;
    this.owleryLevel1.visible = progress === 100;
    this.owleryFoundation1.visible = progress !== null && progress < 50;
    this.owleryFoundation2.visible = progress !== null && progress >= 50 && progress < 100;
    if (this.owleryLevel1.visible) {
      this.owleryLevel1.start();
    }
  };
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
