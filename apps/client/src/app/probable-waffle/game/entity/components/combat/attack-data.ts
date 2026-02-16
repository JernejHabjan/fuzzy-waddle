import { AnimationType } from "../animation/animation-type";
import { WeaponType } from "./weapon-type";
import type { SoundDefinition } from "../actor-audio/sound-definition";
import type { ProjectileData } from "./projectile-data";
import { DamageType } from "@fuzzy-waddle/api-interfaces";

export interface AttackData {
  // Time before this attack can be used again, in seconds
  cooldown: number;
  damage: number;
  damageType: DamageType;
  canTargetAir: boolean;
  // nr of tiles the attack can reach
  range: number;
  minRange: number;
  // Bonus range (in tiles) granted when attacker has high ground advantage (z >= 64 above target)
  highGroundRangeBonus?: number;
  // Type of the projectile to spawn - if not set, damage will be dealt instantly
  projectile?: ProjectileData;
  animationType: AnimationType;
  sounds: {
    preparing: SoundDefinition[] | null;
    fire: SoundDefinition[] | null;
    hit: SoundDefinition[] | null;
  };
  weaponType: WeaponType;
  // in milliseconds from attack start
  delays: {
    fire: number;
    hit: number;
  };
}
