import type { PlayerNumber } from "../player/player";
import { GameResultStatus } from "../../database/database-enums";

/**
 * Core player score data structure
 */
export interface PlayerScoreData {
  playerNumber: PlayerNumber;
  playerName: string;
  playerType: string; // 'Human' | 'AI'
  teamNumber?: number;
  factionType: string;
  gameResult: GameResultStatus;
  eliminated: boolean;
  eliminatedAt?: number;
  finalScore: number;
  metrics: Record<string, number>; // Dynamic metrics as key-value pairs
  userId?: string; // For linking to user profiles
}

/**
 * Snapshot of player scores at a point in time (for charts)
 */
export interface PlayerScoreSnapshot {
  unitsCount: number;
  buildingsCount: number;
  totalResources: number;
  armyValue: number;
}

/**
 * Game score snapshot with all players
 */
export interface GameScoreSnapshot {
  timestamp: number;
  playerScores: Map<PlayerNumber, PlayerScoreSnapshot>;
}

/**
 * JSON-serializable snapshot (Maps replaced with arrays for API transport)
 */
export interface GameScoreSnapshotDto {
  timestamp: number;
  playerScores: Array<PlayerScoreSnapshot & { playerNumber: number }>;
}

/**
 * Metric type definition from database catalog
 */
export interface ScoreMetricType {
  metricKey: string; // e.g., 'units_produced'
  metricName: string; // e.g., 'Units Produced'
  metricCategory: string; // units/buildings/resources/combat/economy
  description?: string;
  displayOrder: number;
}

/**
 * Standard metrics used across the game
 */
export const STANDARD_METRICS = {
  // Units
  UNITS_PRODUCED: "units_produced",
  UNITS_KILLED: "units_killed",
  UNITS_LOST: "units_lost",
  // Buildings
  BUILDINGS_CONSTRUCTED: "buildings_constructed",
  BUILDINGS_DESTROYED: "buildings_destroyed",
  BUILDINGS_LOST: "buildings_lost",
  // Resources
  RESOURCES_COLLECTED_MINERALS: "resources_collected_minerals",
  RESOURCES_COLLECTED_STONE: "resources_collected_stone",
  RESOURCES_COLLECTED_WOOD: "resources_collected_wood",
  RESOURCES_SPENT_MINERALS: "resources_spent_minerals",
  RESOURCES_SPENT_STONE: "resources_spent_stone",
  RESOURCES_SPENT_WOOD: "resources_spent_wood",
  FINAL_RESOURCES_MINERALS: "final_resources_minerals",
  FINAL_RESOURCES_STONE: "final_resources_stone",
  FINAL_RESOURCES_WOOD: "final_resources_wood",
  // Combat
  DAMAGE_DEALT: "damage_dealt",
  DAMAGE_RECEIVED: "damage_received",
  HEALING_DONE: "healing_done",
  // Economy
  MAX_ARMY_SIZE: "max_army_size",
  MAX_BUILDING_COUNT: "max_building_count"
} as const;
