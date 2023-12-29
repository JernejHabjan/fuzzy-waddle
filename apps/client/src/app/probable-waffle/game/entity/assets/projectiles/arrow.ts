import { Projectile } from "../../combat/projectiles/projectile";
import { DamageTypes } from "../../combat/damage-types";
import { ProjectileData } from "../../combat/projectiles/projectile-data";
import { RepresentableActor, RepresentableActorDefinition } from "../../actor/representable-actor";
import { Scene } from "phaser";

export const ArrowTextureMapDefinition: RepresentableActorDefinition = {
  textureMapDefinition: {
    textureName: "arrow",
    spriteSheet: {
      name: "arrow",
      path: "general/arrow/",
      frameConfig: {
        frameWidth: 64,
        frameHeight: 64
      }
    }
  }
};

export class Arrow extends Projectile {
  projectileData = new ProjectileData(10, DamageTypes.DamageTypeNormal, 100, 100);
  representableActorDefinition: RepresentableActorDefinition = ArrowTextureMapDefinition;

  constructor(scene: Scene, damageCauser: RepresentableActor) {
    super(scene, damageCauser);
  }
}
