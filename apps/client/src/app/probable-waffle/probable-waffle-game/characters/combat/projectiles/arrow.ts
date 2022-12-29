import { Projectile } from './projectile';
import { DamageTypes } from '../damage-types';
import { ProjectileData } from './projectile-data';
import { RepresentableActor } from '../../representable-actor';
import { TextureMapDefinition } from '../../movable-actor';

export const ArrowTextureMapDefinition: TextureMapDefinition = {
  textureName: 'arrow',
  spriteSheet: {
    name: 'arrow',
    frameConfig: {
      frameWidth: 64,
      frameHeight: 64
    }
  }
};
export class Arrow extends Projectile {
  projectileData = new ProjectileData(10, DamageTypes.DamageTypeNormal, 100, 100);
  textureMapDefinition: TextureMapDefinition = ArrowTextureMapDefinition;

  constructor(scene: Phaser.Scene, damageCauser: RepresentableActor) {
    super(scene, damageCauser);
  }
}
