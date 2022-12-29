import { Projectile } from './projectile';
import { DamageTypes } from '../damage-types';
import { ProjectileData } from './projectile-data';
import { RepresentableActor } from '../../representable-actor';
import { TextureMapDefinition } from '../../movable-actor';

export const FireBallTextureMapDefinition: TextureMapDefinition = {
  textureName: 'fireball',
  spriteSheet: {
    name: 'fireball',
    frameConfig: {
      frameWidth: 64,
      frameHeight: 64
    }
  }
};

export class FireBall extends Projectile {
  textureMapDefinition: TextureMapDefinition = FireBallTextureMapDefinition;
  projectileData = new ProjectileData(20, DamageTypes.DamageTypeFire, 50, 100);
  constructor(scene: Phaser.Scene, damageCauser: RepresentableActor) {
    super(scene, damageCauser);
  }
}
