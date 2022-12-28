import { Projectile } from './projectile';
import { DamageTypes } from '../damage-types';
import { ProjectileData } from './projectile-data';

export class Arrow extends Projectile {
  projectileData = new ProjectileData(10, DamageTypes.DamageTypeNormal, 100, 100);
}
