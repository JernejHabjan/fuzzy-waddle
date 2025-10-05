import { Blackboard } from "../../ai/blackboard";
import { ResourceType, type Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import type { MapAnalysis } from "./ai-behavior/map-analyzer";

export class PlayerAiBlackboard extends Blackboard {
  constructor(
    public resources: number = 0,
    public units: Phaser.GameObjects.GameObject[] = [], // Replace 'any' with the specific unit class
    public workers: Phaser.GameObjects.GameObject[] = [], // Replace 'any' with your worker unit class
    public defendingUnits: any[] = [], // Units assigned for base defense
    public visibleEnemies: any[] = [], // Enemies visible to the player
    public enemiesNearBase: any[] = [], // Enemies within a certain range of the base
    public enemyBase: any = null, // Reference to the enemy base (replace 'any' with the proper type)
    public primaryTarget: any = null, // The main target to attack (an enemy unit or building)
    public mapFullyExplored: boolean = false,
    public trainingBuildings: Phaser.GameObjects.GameObject[] = [], // Buildings that can train new units
    public productionBuildings: any[] = [], // Buildings that produce resources or military units
    public defensiveStructures: any[] = [], // Defensive buildings like towers, walls, etc.
    public desiredProductionBuildings: number = 5, // Desired number of production buildings
    public desiredDefensiveStructures: number = 3, // Desired number of defensive buildings
    public housingCapacity: number = 0, // Total housing capacity for the player's units
    public baseSize: number = 0, // Current size of the player's base (based on expansion)
    public desiredBaseSize: number = 3, // Desired size of the player's base (expansion goal)
    public upgradeBuilding: Phaser.GameObjects.GameObject | null = null, // Building responsible for upgrades (tech or unit)
    public militaryStrength: number = 0, // Overall military power
    public enemyMilitaryStrength: number = 0, // Estimated enemy military strength
    public enemyFlankOpen: boolean = false, // Is the enemy's flank open for an attack?
    public enemiesInCombat: any[] = [], // Enemies currently engaged in combat
    public selectedStructure: any = null, // The structure currently selected by the player
    public currentStrategy: string = "defensive", // Current strategy: "aggressive", "defensive", "economic"
    // Map analysis/cache (phase 1)
    public mapAnalysis: MapAnalysis | null = null,
    public baseCenterTile: Vector2Simple | null = null,
    public suggestedBuildTiles: Vector2Simple[] = []
  ) {
    super();
  }

  availableStructures(): Array<any> {
    // Example: Return available structures that can be built
    return [
      { name: "Barracks", cost: 150 },
      { name: "Farm", cost: 100 },
      { name: "Tower", cost: 200 }
    ];
  }

  getMostNeededResource(): { type: ResourceType; amount: number } | null {
    // Example: Return the resource type that is most critically needed
    if (this.resources < 200) {
      return { type: ResourceType.Wood, amount: 300 };
    } else if (this.resources < 500) {
      return { type: ResourceType.Wood, amount: 200 };
    }
    return null;
  }

  getData(): Record<string, any> {
    throw new Error("Method not implemented.");
  }
  setData(data: Partial<Record<string, any>>, scene: Phaser.Scene): void {
    throw new Error("Method not implemented.");
  }
}
