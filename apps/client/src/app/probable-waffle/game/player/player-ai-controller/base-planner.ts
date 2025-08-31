import { MapAnalyzer, type MapAnalysis } from "./map-analyzer";
import type { Vector2Simple } from "@fuzzy-waddle/api-interfaces";

/**
 * BasePlanner (phase 2)
 * - Decides WHICH buildings to build and picks final spots from MapAnalyzer candidates.
 * - For now it's a stub scaffold so other systems can reference it.
 */
export class BasePlanner {
  constructor(private readonly analyzer: MapAnalyzer) {}

  getLatestAnalysis(): MapAnalysis | undefined {
    // In phase 1, delegate to analyzer and return cached snapshot
    return (this.analyzer as any)["lastResult"] as MapAnalysis | undefined;
  }

  // Placeholder for next step
  chooseNextBuildingAndLocation(): { buildingName: string; tile: Vector2Simple } | null {
    return null;
  }
}
