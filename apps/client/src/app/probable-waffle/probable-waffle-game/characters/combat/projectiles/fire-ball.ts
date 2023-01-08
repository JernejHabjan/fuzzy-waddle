import { Projectile } from './projectile';
import { DamageTypes } from '../damage-types';
import { ProjectileData } from './projectile-data';
import { RepresentableActor, RepresentableActorDefinition } from '../../representable-actor';

export const FireBallTextureMapDefinition: RepresentableActorDefinition = {
  textureMapDefinition: {
    textureName: 'fireball',
    spriteSheet: {
      name: 'fireball',
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
  constructor(scene: Phaser.Scene, damageCauser: RepresentableActor) {
    super(scene, damageCauser);
  }
}
