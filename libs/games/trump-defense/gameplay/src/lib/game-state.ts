import type { ActorVisualKind, GridPoint, LevelDefinition, TowerKind } from "./level-definition";

export interface PositionComponent {
  x: number;
  y: number;
  z: number;
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
  health?: HealthComponent;
  path?: PathFollowerComponent;
  weapon?: WeaponComponent;
  tower?: TowerComponent;
}

export type GameSound = "spawn" | "baloon" | "cash" | "die" | "pew" | "cannon" | "buildWall" | "select";

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
  sounds: GameSound[];
  shotEffects: Array<{ from: PositionComponent; to: PositionComponent }>;
}

export interface ActionResult {
  ok: boolean;
  message: string;
}

export const tileKey = ([x, z]: GridPoint): string => `${x},${z}`;

export const isEnemy = (entity: GameEntity): boolean => !!entity.health && !!entity.path;
export const isTower = (entity: GameEntity): boolean => !!entity.weapon && !!entity.tower;
