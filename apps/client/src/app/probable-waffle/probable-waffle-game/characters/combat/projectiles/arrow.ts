import { Projectile } from './projectile';
import { DamageTypes } from '../damage-types';
import { ProjectileData } from './projectile-data';
import { RepresentableActor, RepresentableActorDefinition } from '../../representable-actor';

export const ArrowTextureMapDefinition: RepresentableActorDefinition = {
  textureMapDefinition: {
    textureName: 'arrow',
    spriteSheet: {
      name: 'arrow',
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

  constructor(scene: Phaser.Scene, damageCauser: RepresentableActor) {
    super(scene, damageCauser);
  }
}
