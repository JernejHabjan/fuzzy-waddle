import { Projectile } from './projectile';
import { DamageTypes } from '../damage-types';
import { ProjectileData } from './projectile-data';
import { Pawn } from '../../pawn';

export class Arrow extends Projectile {
  projectileData = new ProjectileData(10, DamageTypes.DamageTypeNormal, 100, 100);

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
