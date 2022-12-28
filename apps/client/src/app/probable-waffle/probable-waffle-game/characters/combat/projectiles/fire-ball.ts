import { Projectile } from './projectile';
import { DamageTypes } from '../damage-types';
import { ProjectileData } from './projectile-data';
import { Pawn } from '../../pawn';

export class FireBall extends Projectile {
  projectileData = new ProjectileData(20, DamageTypes.DamageTypeFire, 50, 100);
  constructor(scene: Phaser.Scene, damageCauser: Pawn) {
    super(
      scene,
      {
        tilePlacementData: damageCauser.transformComponent.tilePlacementData,
        textureName: 'arrow'
      },
      damageCauser
    );
  }
}
