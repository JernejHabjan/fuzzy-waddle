import type {
  ActorVisualKind,
  EnemyKind,
  LevelDefinition,
  TowerKind,
  TowerDefinition,
  VisualAsset
} from "../lib/level-definition";

const visual = (name: string): VisualAsset => ({ model: `models/${name}.obj`, texture: `textures/${name}.webp` });
const actorNames: ActorVisualKind[] = [
  "SniperTower",
  "SniperTower2",
  "Cannon",
  "Cannon2",
  "MexicanBanjo",
  "Builder",
  "MexicanBalooner",
  "MexicanMafia",
  "MexicanBaloon",
  "Rocket"
];

export function makeLevel(id: 1 | 2 | 3): LevelDefinition {
  const roster: EnemyKind[] = ["MexicanBanjo"];
  if (id >= 2) roster.push("Builder", "MexicanBalooner");
  if (id >= 3) roster.push("MexicanMafia", "MexicanBaloon");
  const tower = (kind: TowerKind): TowerDefinition => ({
    enabled: kind === "Cannon" || id > 1,
    label: kind,
    visual: kind,
    upgradedVisual: kind === "Cannon" ? "Cannon2" : "SniperTower2",
    cost: kind === "Cannon" ? 30 : 20,
    upgradeCost: 50,
    range: id === 2 ? 20 : 30,
    damage: kind === "Cannon" ? 15 : 10,
    cooldownMs: 1000,
    rotateToTarget: kind === "Cannon",
    canHitFlying: kind === "SniperTower",
    airBonusDamage: kind === "SniperTower" ? 10 : 0,
    fireSound: kind === "Cannon" ? "cannon" : "pew",
    upgradeRange: 20,
    upgradeDamage: 20
  });
  return {
    version: 1,
    id,
    name: `Level ${id}`,
    grid: { width: 16, height: 12, tileSize: 8 },
    paths: {
      ground: Array.from({ length: 16 }, (_, x) => [x * 8, 64]),
      flying: Array.from({ length: 16 }, (_, x) => [x * 8, 64])
    },
    scene: {
      terrain: { ...visual("Map"), position: [64, 0, -48] },
      pathTile: visual("Tile"),
      buildableTile: visual("BuildTile"),
      wall: { ...visual("Wall"), position: [144, 0, -48] },
      props: [],
      skybox: [],
      ambient: { color: "#ffffff", intensity: 1 },
      directional: { color: "#ffffff", intensity: 1, position: [0, 10, 0] },
      points: [],
      spots: [],
      visuals: {
        ...(Object.fromEntries(actorNames.map((name) => [name, visual(name)])) as Record<ActorVisualKind, VisualAsset>),
        Heart: visual("Heart")
      }
    },
    rules: {
      enemyRoster: roster,
      enemies: {
        MexicanBanjo: { path: "ground", altitude: 0, reward: 10 },
        Builder: { path: "ground", altitude: 0, reward: 10 },
        MexicanBalooner: { path: "flying", altitude: 9, reward: 20 },
        MexicanMafia: { path: "ground", altitude: 0, reward: 10 },
        MexicanBaloon: { path: "flying", altitude: 9, reward: 20 }
      },
      towers: { SniperTower: tower("SniperTower"), Cannon: tower("Cannon") },
      enemyHp: id === 2 ? 70 : id === 3 ? 120 : 100,
      enemyHpIncrease: 10,
      enemyHpIntervalMs: 5000,
      spawnDelayMs: 5000,
      spawnIntervalMs: 2000,
      moveIntervalMs: 500,
      startingMoney: 200,
      startingLives: 10,
      wallCost: 100,
      wallStartDelayMs: 3000,
      wallStep: 5,
      wallGoal: 35,
      randomTowerPlacement: id === 3
    },
    music: "music/test.mp3"
  };
}
