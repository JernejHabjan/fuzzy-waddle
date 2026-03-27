import { ProjectileType } from "./projectile-type";

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
  // Defines how projectile spawns and moves
  spawnBehavior?: {
    // 'launch' = normal projectile from caster to target
    // 'fall' = spawn above target and fall straight down
    type: "launch" | "fall";
    // For 'fall' type: how far above target to spawn (in pixels)
    spawnOffsetY?: number;
    // Custom easing for movement (e.g., 'Cubic.easeIn' for falling)
    ease?: string;
  };
  // 'parabolic' makes the projectile arc through the air (like cannon/ship volley)
  trajectoryType?: "linear" | "parabolic";
  // Peak height (px) above the midpoint for parabolic trajectory (default: 120)
  parabolicPeakHeight?: number;
  // Spawns a trail image at intervals while the projectile travels
  trailEffect?: {
    key: string;
    frame: string;
    intervalMs: number;
  };
}
