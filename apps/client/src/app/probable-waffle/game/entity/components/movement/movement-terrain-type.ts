/**
 * Defines what kind of terrain a unit can traverse.
 * - Ground: standard land units (grass, gravel, sand, snow, stone)
 * - Water: naval units (water tiles only)
 * - Air: flying units (bypasses all terrain checks)
 * - Amphibious: can traverse both ground and water terrain (future use)
 */
export enum MovementTerrainType {
  Ground = "Ground",
  Water = "Water",
  Air = "Air",
  Amphibious = "Amphibious"
}
