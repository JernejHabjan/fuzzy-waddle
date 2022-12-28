import { Projectile } from './projectile';
import { DamageTypes } from '../damage-types';
import { ProjectileData } from './projectile-data';

export class FireBall extends Projectile {
  projectileData = new ProjectileData(20, DamageTypes.DamageTypeFire, 50, 100);
}
