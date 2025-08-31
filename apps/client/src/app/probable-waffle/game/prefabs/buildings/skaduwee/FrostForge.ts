// You can write more code here

/* START OF COMPILED CODE */

import FrostForgeCursor from "./FrostForge/FrostForgeCursor";
import FrostForgeFoundation1 from "./FrostForge/FrostForgeFoundation1";
import FrostForgeFoundation2 from "./FrostForge/FrostForgeFoundation2";
import FrostForgeLevel1 from "./FrostForge/FrostForgeLevel1";
/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { ConstructionGameObjectInterfaceComponent } from "../../../entity/building/construction/construction-game-object-interface-component";
import { setActorData } from "../../../data/actor-data";
/* END-USER-IMPORTS */

export default class FrostForge extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 129, y ?? 323.7847134131514);

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-68.7545786628312 -214.43394506509725 -38.690327299456825 -228.69121890752223 -0.2576760720504012 -233.34032994309558 43.44396766233913 -227.14151522899778 69.16904872584504 -214.74388580080216 71.27223590831247 -192.47146282907468 60.98195252153286 -182.48068661227393 62.22171546435243 -148.38720568473596 69.97023385697469 -142.18839097063815 75.4034707557831 -79.55104366487666 85.32112237919412 -46.381415218517645 96.47898886457017 -37.703074618780704 106.60762571945156 11.039650145841563 74.37378920614296 32.73550164518389 36.251078714441434 42.65360518774037 6.371750760001362 44.99389139705903 -37.82475711902734 42.96354592344528 -76.25740834643375 32.73550164518389 -106.16641807554313 10.997986227988292 -98.7969319792297 -38.23869519017006 -87.09176657806283 -49.2553214500918 -75.38660117689597 -80.92812194736686 -73.32098375316063 -142.20810551818164 -65.05851405821932 -148.40495778938765 -60.82475661048905 -182.48068661227393 -70.74286015304554 -192.08884941912552"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // frostForgeCursor
    const frostForgeCursor = new FrostForgeCursor(scene, 0, 0);
    frostForgeCursor.visible = false;
    this.add(frostForgeCursor);

    // frostForgeFoundation1
    const frostForgeFoundation1 = new FrostForgeFoundation1(scene, 0, 0);
    frostForgeFoundation1.visible = false;
    this.add(frostForgeFoundation1);

    // frostForgeFoundation2
    const frostForgeFoundation2 = new FrostForgeFoundation2(scene, 0, 0);
    frostForgeFoundation2.visible = false;
    this.add(frostForgeFoundation2);

    // frostForgeLevel1
    const frostForgeLevel1 = new FrostForgeLevel1(scene, 0, 0);
    this.add(frostForgeLevel1);

    this.frostForgeCursor = frostForgeCursor;
    this.frostForgeFoundation1 = frostForgeFoundation1;
    this.frostForgeFoundation2 = frostForgeFoundation2;
    this.frostForgeLevel1 = frostForgeLevel1;

    /* START-USER-CTR-CODE */
    this.setup();
    /* END-USER-CTR-CODE */
  }

  private frostForgeCursor: FrostForgeCursor;
  private frostForgeFoundation1: FrostForgeFoundation1;
  private frostForgeFoundation2: FrostForgeFoundation2;
  private frostForgeLevel1: FrostForgeLevel1;

  /* START-USER-CODE */
  override name = ObjectNames.FrostForge;
  private setup() {
    setActorData(
      this,
      [new ConstructionGameObjectInterfaceComponent(this, this.handlePrefabVisibility, this.frostForgeCursor)],
      []
    );
  }

  private handlePrefabVisibility = (progress: number | null) => {
    this.frostForgeCursor.visible = progress === null;
    this.frostForgeLevel1.visible = progress === 100;
    this.frostForgeFoundation1.visible = progress !== null && progress < 50;
    this.frostForgeFoundation2.visible = progress !== null && progress >= 50 && progress < 100;
    if (this.frostForgeLevel1.visible) {
      this.frostForgeLevel1.start();
    }
  };
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
