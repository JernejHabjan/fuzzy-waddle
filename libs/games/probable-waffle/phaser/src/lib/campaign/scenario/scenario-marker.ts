export type ScenarioMarkerKind = "point" | "region" | "route" | "group" | "camera-shot" | "spawn-set";

export interface ScenarioMarker {
  readonly scenarioMarkerKind: ScenarioMarkerKind;
  scenarioId: string;
  x: number;
  y: number;
  z?: number;
}

export function configureScenarioMarker(marker: Phaser.GameObjects.Shape): void {
  marker.setVisible(false);
  marker.removeFromUpdateList();
}
