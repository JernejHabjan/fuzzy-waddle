import type { ActorVisualKind, GridPoint, LevelDefinition, TowerKind } from "./level-definition";

export interface PositionComponent {
  /** Horizontal world coordinate shared with the level grid. */
  x: number;
  /** Height keeps flying actors on their authored lane. */
  y: number;
  /** Three.js world depth uses the negative of the source grid's Z coordinate. */
  z: number;
}

/** Yaw follows the actor's facing direction without coupling orientation to its mesh. */
export interface OrientationComponent {
  /** Radians around the vertical axis; the renderer applies this to the visual only. */
  y: number;
}

export interface HealthComponent {
  current: number;
  reward: number;
}

export interface PathFollowerComponent {
  kind: "ground" | "flying";
  waypoint: number;
}

export interface WeaponComponent {
  range: number;
  damage: number;
  canHitFlying: boolean;
  airBonusDamage: number;
  cooldownMs: number;
  /** Copied from level-authored tower behavior; the combat system never checks tower names. */
  rotateToTarget: boolean;
  fireSound: "pew" | "cannon";
  lastShotMs: number;
  level: 1 | 2;
}

export interface TowerComponent {
  kind: TowerKind;
  tile: GridPoint;
}

/** An entity owns data components; ordered systems own all behavior. */
export interface GameEntity {
  id: number;
  visual: ActorVisualKind;
  position: PositionComponent;
  orientation?: OrientationComponent;
  health?: HealthComponent;
  path?: PathFollowerComponent;
  weapon?: WeaponComponent;
  tower?: TowerComponent;
}

/** Named audio actions map to original files in the interface audio adapter. */
export type GameSound =
  | "spawn"
  | "baloon"
  | "cash"
  | "die"
  | "pew"
  | "cannon"
  | "buildWall"
  | "select"
  | "buy"
  | "upgrade"
  | "lifeLost";

/** A sound cue keeps its world origin so the browser adapter can attenuate and pan it. */
export interface GameSoundCue {
  /** Effect identity is separate from its file path and playback policy. */
  kind: GameSound;
  /** Optional map X origin enables camera-based hearing distance and stereo pan. */
  worldX?: number;
}

/** A tower shot remains in flight long enough for Three.js to animate its rocket model. */
export interface ProjectileEffect {
  /** Stable for the effect's full simulated flight. */
  id: number;
  /** Firing tower position copied when the shot begins. */
  from: PositionComponent;
  /** Target position copied when the shot begins. */
  to: PositionComponent;
  /** Simulation time already spent travelling. */
  elapsedMs: number;
  /** Removes the shot after the renderer has shown its flight. */
  durationMs: number;
}

export interface GameState {
  level: LevelDefinition;
  status: "playing" | "paused" | "won" | "lost";
  money: number;
  lives: number;
  wallHeight: number;
  selectedTile: GridPoint | null;
  entities: Map<number, GameEntity>;
  occupied: Set<string>;
  blocked: Set<string>;
  elapsedMs: number;
  spawnMs: number;
  movementMs: number;
  hpIncreaseMs: number;
  bonusHp: number;
  spawnIndex: number;
  nextEntityId: number;
  nextProjectileId: number;
  sounds: GameSoundCue[];
  shotEffects: ProjectileEffect[];
}

export interface ActionResult {
  ok: boolean;
  message: string;
}

export const tileKey = ([x, z]: GridPoint): string => `${x},${z}`;

export const isEnemy = (entity: GameEntity): boolean => !!entity.health && !!entity.path;
export const isTower = (entity: GameEntity): boolean => !!entity.weapon && !!entity.tower;
