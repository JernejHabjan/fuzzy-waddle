/** Original grid coordinates are X and positive Z; Three.js displays them at negative Z. */
export type GridPoint = readonly [x: number, z: number];
export type WorldPoint = readonly [x: number, y: number, z: number];

export type EnemyKind = "MexicanBanjo" | "Builder" | "MexicanBalooner" | "MexicanMafia" | "MexicanBaloon";
export type TowerKind = "SniperTower" | "Cannon";
export type ActorVisualKind = EnemyKind | TowerKind | "SniperTower2" | "Cannon2" | "Rocket";
export type SceneVisualKind = ActorVisualKind | "Heart";
/** Models available to tutorial displays, including a level's build-site marker. */
export type TutorialVisualKind = SceneVisualKind | "BuildTile" | "Wall";
/** A briefing may feature one model or a paired set, or leave the map visible. */
export type TutorialShowcaseSelection = TutorialVisualKind | readonly TutorialVisualKind[] | null;

/** Level-authored components describe an enemy; systems never infer traits from its name. */
export interface EnemyDefinition {
  path: "ground" | "flying";
  altitude: number;
  reward: number;
}

/** Tower behavior and upgrade values stay in data, independent of visual names. */
export interface TowerDefinition {
  /** Campaign availability is authored per level and enforced by purchase actions. */
  enabled: boolean;
  label: string;
  visual: ActorVisualKind;
  upgradedVisual: ActorVisualKind;
  cost: number;
  upgradeCost: number;
  range: number;
  damage: number;
  cooldownMs: number;
  /** Whether combat updates this tower's yaw to track its current target. */
  rotateToTarget: boolean;
  canHitFlying: boolean;
  airBonusDamage: number;
  fireSound: "pew" | "cannon";
  upgradeRange: number;
  upgradeDamage: number;
}

/** Paths are relative to the Trump Defense asset directory copied by the portal build. */
export interface VisualAsset {
  model: string;
  texture: string;
  specular?: string;
}

export interface SceneProp extends VisualAsset {
  position: WorldPoint;
  rotationY?: number;
}

export interface SceneLight {
  color: string;
  intensity: number;
  position: WorldPoint;
  distance?: number;
  target?: WorldPoint;
  angle?: number;
}

/** A self-contained level can change its scene without changing renderer code. */
export interface LevelDefinition {
  version: 1;
  id: 1 | 2 | 3;
  name: string;
  grid: { width: number; height: number; tileSize: number };
  paths: { ground: GridPoint[]; flying: GridPoint[] };
  scene: {
    terrain: SceneProp;
    pathTile: VisualAsset;
    /** Visual markers are authored per level and occupy every non-path grid cell. */
    buildableTile: VisualAsset;
    wall: SceneProp;
    props: SceneProp[];
    /** CubeTextureLoader order: +X, -X, +Y, -Y, +Z/front, -Z/back. */
    skybox: string[];
    ambient: { color: string; intensity: number };
    directional: SceneLight;
    points: SceneLight[];
    spots: SceneLight[];
    visuals: Record<SceneVisualKind, VisualAsset>;
  };
  rules: {
    enemyRoster: EnemyKind[];
    enemies: Record<EnemyKind, EnemyDefinition>;
    towers: Record<TowerKind, TowerDefinition>;
    enemyHp: number;
    enemyHpIncrease: number;
    enemyHpIntervalMs: number;
    spawnDelayMs: number;
    spawnIntervalMs: number;
    moveIntervalMs: number;
    startingMoney: number;
    startingLives: number;
    wallCost: number;
    wallStartDelayMs: number;
    wallStep: number;
    wallGoal: number;
    randomTowerPlacement: boolean;
  };
  music: string;
  /** Optional effect played once when deployment begins, after the level briefing. */
  startSound?: "buildWallOpening";
}
