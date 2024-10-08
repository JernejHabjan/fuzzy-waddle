// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { ANIM_TIVARA_BUILDINGS_ANKGUARD_FLAME_STICK } from "../../../../../../assets/probable-waffle/atlas/anims/tivara/buildings";
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
import { ProductionComponent, ProductionDefinition } from "../../../entity/building/production/production-component";
import TivaraSlingshotFemale from "../../characters/tivara/TivaraSlingshotFemale";
import TivaraMacemanMale from "../../characters/tivara/TivaraMacemanMale";
import { VisionComponent, VisionDefinition } from "../../../entity/actor/components/vision-component";
import { ColliderComponent } from "../../../entity/actor/components/collider-component";
import { InfoComponent, InfoDefinition } from "../../../entity/actor/components/info-component";
import {
  ANIM_BUILDING_ICON_ANIMS_TIVARA_ANKGUARD_ACTION,
  ANIM_BUILDING_ICON_ANIMS_TIVARA_ANKGUARD_IDLE
} from "../../gui/icon-animations";
import {
  ObjectDescriptorComponent,
  ObjectDescriptorDefinition
} from "../../../entity/actor/components/object-descriptor-component";
import { ObjectNames } from "../../../data/object-names";
/* END-USER-IMPORTS */

export default class AnkGuard extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 128, y ?? 182.8318108210126);

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-72.22985939462845 -86.73420955564553 0.01286537585883707 -123.56383394844298 68.9503674444284 -88.15073357075313 69.89471678783346 -63.12547597051896 110.02956388254862 -46.12718778922783 115.22348527127645 -20.62975551729116 114.75131059957391 17.616392890613866 51.95207926313728 47.835571879575866 0.48504004756136965 65.30603473256951 -101.97686371188792 14.7833448603987 -101.97686371188792 -13.074960770050666 -83.08987684378667 -13.547135441753198"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // ankguard-building
    const ankguard_building = scene.add.image(
      0,
      -54.83180956776931,
      "factions",
      "buildings/tivara/ankguard/ankguard.png"
    );
    this.add(ankguard_building);

    // tivara_buildings_aknguard_flame
    const tivara_buildings_aknguard_flame = scene.add.sprite(
      -4,
      41.16819043223069,
      "factions",
      "buildings/tivara/ankguard/ankguard-flame/ankguard-flame-0.png"
    );
    tivara_buildings_aknguard_flame.play("tivara-buildings-aknguard-flame");
    this.add(tivara_buildings_aknguard_flame);

    // tivara_buildings_ankguard_flame_stick_right
    const tivara_buildings_ankguard_flame_stick_right = scene.add.sprite(
      -43,
      15,
      "factions",
      "buildings/tivara/ankguard/ankguard-flame-stick/flame-stick-1.png"
    );
    tivara_buildings_ankguard_flame_stick_right.play("tivara-buildings-ankguard-flame-stick");
    this.add(tivara_buildings_ankguard_flame_stick_right);

    // tivara_buildings_ankguard_flame_stick_left
    const tivara_buildings_ankguard_flame_stick_left = scene.add.sprite(
      -97,
      -11,
      "factions",
      "buildings/tivara/ankguard/ankguard-flame-stick/flame-stick-1.png"
    );
    tivara_buildings_ankguard_flame_stick_left.play("tivara-buildings-ankguard-flame-stick");
    this.add(tivara_buildings_ankguard_flame_stick_left);

    // tivara_buildings_ankguard_flag
    const tivara_buildings_ankguard_flag = scene.add.sprite(
      -29,
      -123,
      "factions",
      "buildings/tivara/ankguard/ankguard-flag/flag-0.png"
    );
    tivara_buildings_ankguard_flag.play("tivara-buildings-ankguard-flag");
    this.add(tivara_buildings_ankguard_flag);

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
              originalColor: 0x800080,
              epsilon: 0
            }
          ]
        } satisfies OwnerDefinition),
        new VisionComponent(this, {
          range: 5
        } satisfies VisionDefinition),
        new IdComponent(),
        new InfoComponent({
          name: "Ank Guard",
          description: "Produces Slingshot and Maceman",
          portraitAnimation: {
            idle: ANIM_BUILDING_ICON_ANIMS_TIVARA_ANKGUARD_IDLE,
            action: ANIM_BUILDING_ICON_ANIMS_TIVARA_ANKGUARD_ACTION
          },
          smallImage: {
            key: "factions",
            frame: "building_icons/tivara/ankguard.png"
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
        new ProductionComponent(this, {
          queueCount: 1,
          capacityPerQueue: 5,
          availableProductGameObjectClasses: [TivaraSlingshotFemale.name, TivaraMacemanMale.name]
        } satisfies ProductionDefinition),
        new ColliderComponent()
      ],
      []
    );

    // delay playing of animation for one of flame stick
    setTimeout(() => {
      if (!this.active) return;
      tivara_buildings_ankguard_flame_stick_left.play(ANIM_TIVARA_BUILDINGS_ANKGUARD_FLAME_STICK);
    }, 1000);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  name = ObjectNames.AnkGuard;
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
