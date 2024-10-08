// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { setActorData } from "../../../data/actor-data";
import { OwnerComponent, OwnerDefinition } from "../../../entity/actor/components/owner-component";
import { SelectableComponent } from "../../../entity/actor/components/selectable-component";
import { IdComponent } from "../../../entity/actor/components/id-component";
import { HealthComponent, HealthDefinition } from "../../../entity/combat/components/health-component";
import {
  ProductionCostComponent,
  ProductionCostDefinition
} from "../../../entity/building/production/production-cost-component";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../entity/building/payment-type";
import { RequirementsComponent, RequirementsDefinition } from "../../../entity/actor/components/requirements-component";
import { ProductionComponent, ProductionDefinition } from "../../../entity/building/production/production-component";
import AnkGuard from "./AnkGuard";
import TivaraSlingshotFemale from "../../characters/tivara/TivaraSlingshotFemale";
import { VisionComponent, VisionDefinition } from "../../../entity/actor/components/vision-component";
import { ColliderComponent } from "../../../entity/actor/components/collider-component";
import { InfoComponent, InfoDefinition } from "../../../entity/actor/components/info-component";
import {
  ANIM_BUILDING_ICON_ANIMS_TIVARA_TEMPLE_ACTION,
  ANIM_BUILDING_ICON_ANIMS_TIVARA_TEMPLE_IDLE
} from "../../gui/icon-animations";
import {
  ObjectDescriptorComponent,
  ObjectDescriptorDefinition
} from "../../../entity/actor/components/object-descriptor-component";
import { ObjectNames } from "../../../data/object-names";
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

    // buildings_tivara_temple
    const buildings_tivara_temple = scene.add.image(
      -0.30766778687379315,
      -36.666560409786456,
      "factions",
      "buildings/tivara/temple/temple.png"
    );
    this.add(buildings_tivara_temple);

    // buildings_tivara_temple_temple_olival
    const buildings_tivara_temple_temple_olival = scene.add.image(
      -2,
      -13,
      "factions",
      "buildings/tivara/temple/temple-olival.png"
    );
    this.add(buildings_tivara_temple_temple_olival);

    /* START-USER-CTR-CODE */
    setActorData(
      this,
      [
        new ObjectDescriptorComponent({
          color: 0xc2a080
        } satisfies ObjectDescriptorDefinition),
        new OwnerComponent(this, {
          color: [
            {
              originalColor: 0x5c9999,
              epsilon: 0
            }
          ]
        } satisfies OwnerDefinition),
        new VisionComponent(this, {
          range: 5
        } satisfies VisionDefinition),
        new IdComponent(),
        new VisionComponent(this, {
          range: 5
        } satisfies VisionDefinition),
        new IdComponent(),
        new InfoComponent({
          name: "Temple",
          description: "Produces Tivara Sling shooters",
          portraitAnimation: {
            idle: ANIM_BUILDING_ICON_ANIMS_TIVARA_TEMPLE_IDLE,
            action: ANIM_BUILDING_ICON_ANIMS_TIVARA_TEMPLE_ACTION
          },
          smallImage: {
            key: "factions",
            frame: "building_icons/tivara/temple.png"
          }
        } satisfies InfoDefinition),
        new SelectableComponent(this),
        new HealthComponent(this, {
          maxHealth: 100
        } satisfies HealthDefinition),
        new ProductionCostComponent(this, {
          resources: {
            [ResourceType.Wood]: 10,
            [ResourceType.Minerals]: 10
          },
          refundFactor: 0.5,
          productionTime: 1000,
          costType: PaymentType.PayImmediately
        } satisfies ProductionCostDefinition),
        new RequirementsComponent(this, {
          actors: [AnkGuard.name]
        } satisfies RequirementsDefinition),
        new ProductionComponent(this, {
          queueCount: 1,
          capacityPerQueue: 5,
          availableProductGameObjectClasses: [TivaraSlingshotFemale.name]
        } satisfies ProductionDefinition),
        new ColliderComponent()
      ],
      []
    );

    this.bounce(buildings_tivara_temple_temple_olival);
    setTimeout(() => {
      this.addGlow(scene, buildings_tivara_temple_temple_olival);
    }, 1000);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  name = ObjectNames.Temple;
  private addGlow = (scene: Phaser.Scene, image: Phaser.GameObjects.Image) => {
    // https://labs.phaser.io/view.html?src=src\fx\glow\glow%20fx.js
    if (!image.preFX) return;
    image.preFX.setPadding(32);
    const fx = image.preFX.addGlow();

    //  For PreFX Glow the quality and distance are set in the Game Configuration
    scene.tweens.add({
      targets: fx,
      outerStrength: 1,
      yoyo: true,
      loop: -1,
      ease: "sine.inout"
    });
  };
  private bounce = (image: Phaser.GameObjects.Image) => {
    // bounce the sprite up and down forever with a 2 seconds duration
    this.scene.tweens.add({
      targets: image,
      y: "-=4", // move up by 4
      duration: 1000, // takes 1000ms
      ease: "Sine.InOut",
      yoyo: true, // reverse the animation after it completes
      loop: -1 // loop indefinitely
    });
  };

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
