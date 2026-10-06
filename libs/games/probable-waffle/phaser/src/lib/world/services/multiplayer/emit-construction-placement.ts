import type Phaser from "phaser";
import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { ConstructCommand, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { PRODUCTION_SPATIAL_AUTHORITY_EVENT, type ProductionSpatialAuthorityEvent } from "./production-spatial-authority-event";

/** Publishes the already evaluated footprint verdict before destruction or builder assignment; no extra checks. */
export function emitConstructionPlacement(
  scene: Phaser.Scene, command: ConstructCommand, site: Phaser.GameObjects.GameObject,
  footprint: readonly Vector2Simple[], legal: boolean, admissionCost: Readonly<Partial<Record<ResourceType, number>>>
): void {
  if (!scene.events.listenerCount(PRODUCTION_SPATIAL_AUTHORITY_EVENT)) return;
  scene.events.emit(PRODUCTION_SPATIAL_AUTHORITY_EVENT,
    { kind: "placement", command, site, footprint, legal, admissionCost: { ...admissionCost } }
    satisfies ProductionSpatialAuthorityEvent);
}
