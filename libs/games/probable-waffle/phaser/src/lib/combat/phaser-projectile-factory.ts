import { ProjectileType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/projectile-type";
import Phaser from "phaser";
import Arrow from "../prefabs/weapons/Arrow";
import FireArrow from "../prefabs/weapons/FireArrow";
import FireBall from "../prefabs/weapons/FireBall";
import FrostBolt from "../prefabs/weapons/FrostBolt";
import SkaduweeOwlFurball from "../prefabs/weapons/SkaduweeOwlFurball";
import SlingshotRock from "../prefabs/weapons/SlingshotRock";
import TivaraAlchemistVase from "../prefabs/weapons/TivaraAlchemistVase";

/**
 * Maps framework-free projectile types to their concrete Phaser Editor prefabs.
 *
 * Gameplay code owns projectile rules and identifiers; this Phaser project owns
 * the visual classes and is the only layer that should construct them directly.
 */
export class PhaserProjectileFactory {
  static create(scene: Phaser.Scene, projectileType: ProjectileType): Phaser.GameObjects.Image | undefined {
    switch (projectileType) {
      case ProjectileType.SlingshotProjectile:
        return new SlingshotRock(scene);
      case ProjectileType.FlowerSpit:
        return new SlingshotRock(scene); // todo poison dart -  // todo use mobs_flower_monster_plant shot anim
      case ProjectileType.SandWormAcid:
        return new SlingshotRock(scene); // todo poison dart -  // todo use mobs_flower_monster_plant shot anim
      case ProjectileType.ArrowProjectile:
        return new Arrow(scene);
      case ProjectileType.FireArrowProjectile:
        return new FireArrow(scene);
      case ProjectileType.FireballProjectile:
        return new FireBall(scene);
      case ProjectileType.FurballProjectile:
        return new SkaduweeOwlFurball(scene);
      case ProjectileType.VaseProjectile:
        return new TivaraAlchemistVase(scene);
      case ProjectileType.CorpyAcidProjectile:
        return new SkaduweeOwlFurball(scene); // todo
      case ProjectileType.FrostBoltProjectile:
      case ProjectileType.SnowstormProjectile:
        return new FrostBolt(scene);
      default:
        return undefined;
    }
  }
}
