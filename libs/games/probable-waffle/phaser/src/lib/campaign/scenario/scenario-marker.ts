import Phaser from "phaser";
/**
 * Defines the closed scenario marker kind value set. Keeping this union named preserves exhaustive handling
 * and prevents incompatible free-form values at its boundaries.
 */
export type ScenarioMarkerKind = "point" | "region" | "route" | "group" | "camera-shot" | "spawn-set";

/**
 * Defines the structured scenario marker contract for this module. Its declared surface makes scenario marker
 * kind, scenario id, x, y, z explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface ScenarioMarker {
  /**
   * discriminator for {@link ScenarioMarker}. It selects the valid branch and behavior, so producers and
   * consumers must keep it synchronized with the accompanying fields.
   */
  readonly scenarioMarkerKind: ScenarioMarkerKind;
  /**
   * stable scenario id used by {@link ScenarioMarker} to correlate this value with related records, events, or
   * authored content; it is not a display label.
   */
  scenarioId: string;
  /**
   * numeric x carried by {@link ScenarioMarker}. Its units and valid range are defined by {@link ScenarioMarker}
   * and must remain consistent across producers and consumers.
   */
  x: number;
  /**
   * numeric y carried by {@link ScenarioMarker}. Its units and valid range are defined by {@link ScenarioMarker}
   * and must remain consistent across producers and consumers.
   */
  y: number;
  /**
   * Optional numeric z carried by {@link ScenarioMarker}. Its units and valid range are defined by {@link
   * ScenarioMarker} and must remain consistent across producers and consumers.
   */
  z?: number;
}

export function configureScenarioMarker(marker: Phaser.GameObjects.Shape): void {
  marker.setVisible(false);
  marker.removeFromUpdateList();
}
