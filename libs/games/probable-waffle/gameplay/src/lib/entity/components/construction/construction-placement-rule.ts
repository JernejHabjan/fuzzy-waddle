/**
 * Terrain placement rule for constructable buildings.
 * - "ground": every footprint tile must be ground-navigable (default).
 * - "coastal": every footprint tile must be ground- or water-navigable, with at least one land tile and one water tile.
 */
export type ConstructionPlacementRule = "ground" | "coastal";
