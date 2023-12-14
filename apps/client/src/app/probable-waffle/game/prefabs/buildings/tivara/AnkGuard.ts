// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
import { ANIM_TIVARA_BUILDINGS_ANKGUARD_FLAME_STICK } from "../../../../../../assets/probable-waffle/atlas/anims/tivara/buildings";
/* END-USER-IMPORTS */

export default class AnkGuard extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 128, y ?? 182.8318108210126);

    this.removeInteractive();
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

    // this (prefab fields)
    this.z = 0;

    /* START-USER-CTR-CODE */
    // Write your code here.

    // delay playing of animation for one of flame stick
    setTimeout(() => {
      tivara_buildings_ankguard_flame_stick_left.play(ANIM_TIVARA_BUILDINGS_ANKGUARD_FLAME_STICK);
    }, 1000);
    this.on("pointerdown", () => {
      ankguard_building.setTint(0xff0000); // Tint to red
      // tint back to transparent after 1 second
      setTimeout(() => {
        ankguard_building.clearTint();
      }, 1000);
    });
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
