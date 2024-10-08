// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { setActorData } from "../../../data/actor-data";
import { OwnerComponent, OwnerDefinition } from "../../../entity/actor/components/owner-component";
import { SelectableComponent } from "../../../entity/actor/components/selectable-component";
import { IdComponent } from "../../../entity/actor/components/id-component";

import { HealthComponent, HealthDefinition } from "../../../entity/combat/components/health-component";
import {
  ProductionCostComponent,
  ProductionCostDefinition
} from "../../../entity/building/production/production-cost-component";
import { PaymentType } from "../../../entity/building/payment-type";
import { RequirementsComponent, RequirementsDefinition } from "../../../entity/actor/components/requirements-component";
import Sandhold from "./Sandhold";
import { VisionComponent, VisionDefinition } from "../../../entity/actor/components/vision-component";
import { ColliderComponent } from "../../../entity/actor/components/collider-component";
import { InfoComponent, InfoDefinition } from "../../../entity/actor/components/info-component";
import {
  ObjectDescriptorComponent,
  ObjectDescriptorDefinition
} from "../../../entity/actor/components/object-descriptor-component";
import { getTilesAroundGameObjectsOfShape } from "../../../data/tile-map-helpers";
import { onSceneInitialized } from "../../../data/game-object-helper";
import { ObjectNames } from "../../../data/object-names";
/* END-USER-IMPORTS */

export default class Olival extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 15.99154048826449, y ?? 54.535253459978904);

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-12.788011962835393 -30.360902541923828 0.5188883965774025 -42.99403579453091 13.657346979288771 -31.70843675553525 15.004881192900193 -10.484772891155345 13.994230532691624 5.854079448883155 -14.809313283252527 5.685637672181727 -15.819963943461094 -10.484772891155345"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // buildings_tivara_olival_floor
    const buildings_tivara_olival_floor = scene.add.image(
      0.008459511735509295,
      4.464746540021096,
      "factions",
      "buildings/tivara/olival/olival-floor.png"
    );
    this.add(buildings_tivara_olival_floor);

    // buildings_tivara_olival
    const buildings_tivara_olival = scene.add.image(0, -22, "factions", "buildings/tivara/olival/olival.png");
    this.add(buildings_tivara_olival);

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
              originalColor: 0x265b17,
              epsilon: 0.1
            }
          ]
        } satisfies OwnerDefinition),
        new VisionComponent(this, {
          range: 5
        } satisfies VisionDefinition),
        new IdComponent(),
        new InfoComponent({
          name: "Olival",
          description: "Creates a suitable surface for Tivara units and buildings",
          smallImage: {
            key: "factions",
            frame: "buildings/tivara/olival/olival.png"
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
          actors: [Sandhold.name]
        } satisfies RequirementsDefinition),
        new ColliderComponent()
      ],
      []
    );

    this.bounce(buildings_tivara_olival);

    onSceneInitialized(this.scene, this.init, this);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  name = ObjectNames.Olival;
  private init() {
    this.tintTilemapAroundTransform(this.scene, 0x7eb3cb, 6);
  }

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

  private tintTilemapAroundTransform = (scene: Phaser.Scene, tint: number, radius: number) => {
    const tiles = getTilesAroundGameObjectsOfShape(this, scene, radius, "circle");
    tiles.forEach((tile) => {
      tile.tint = tint;
    });
  };
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
