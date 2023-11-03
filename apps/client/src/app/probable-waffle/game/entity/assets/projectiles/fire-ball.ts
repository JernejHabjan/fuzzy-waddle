import { Projectile } from '../../combat/projectiles/projectile';
import { DamageTypes } from '../../combat/damage-types';
import { ProjectileData } from '../../combat/projectiles/projectile-data';
import { RepresentableActor, RepresentableActorDefinition } from '../../actor/representable-actor';
import { Scene } from 'phaser';

export const FireBallTextureMapDefinition: RepresentableActorDefinition = {
  textureMapDefinition: {
    textureName: 'fireball',
    spriteSheet: {
      name: 'fireball',
      path: 'general/fireball/',
      frameConfig: {
        frameWidth: 64,
        frameHeight: 64
      }
    }
  }
};

export class FireBall extends Projectile {
  representableActorDefinition: RepresentableActorDefinition = FireBallTextureMapDefinition;
  projectileData = new ProjectileData(20, DamageTypes.DamageTypeFire, 50, 100);

  constructor(scene: Scene, damageCauser: RepresentableActor) {
    super(scene, damageCauser);
  }
}
