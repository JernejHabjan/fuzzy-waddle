export interface ProjectileData {
  type: ProjectileType;
  // nr of world-space pixels per second
  speed: number;
  orientation: {
    // if false, the projectile will rotate so that pointing orientation points towards the target
    randomizeOrientation: boolean;
    // 0 means right - 90 means up - 180 means left - 270 means down
    pointingOrientation: number;
    rotationSpeed?: number;
  };
  impactAnimation?: {
    anims: string[];
    tint?: number;
  };
}

export enum ProjectileType {
  SlingshotProjectile = "slingshotProjectile",
  ArrowProjectile = "arrowProjectile",
  FireballProjectile = "fireballProjectile",
  FrostBoltProjectile = "frostBoltProjectile",
  FurballProjectile = "furballProjectile"
}
