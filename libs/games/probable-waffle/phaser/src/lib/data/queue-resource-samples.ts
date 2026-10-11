import type Phaser from "phaser";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { getPlayer } from "./scene-data";

/** Preserve sparse zero entries; malformed/unknown/non-finite values become an explicit missing sample. */
export function sampleQueueResourceVector(
  resources: Readonly<Partial<Record<ResourceType, number>>>
): Partial<Record<ResourceType, number>> | null {
  const types = Object.values(ResourceType);
  if (Object.entries(resources).some(([key, value]) =>
    !types.some((type) => type === key) || typeof value !== "number" || !Number.isFinite(value) || value < 0)) return null;
  return { ...resources };
}

/** Read actual player authority at this operation boundary, never the capture's previous observed balance. */
export function sampleQueueResourceBalance(scene: Phaser.Scene, playerNumber: number): Record<ResourceType, number> | null {
  const resources = getPlayer(scene, playerNumber)?.getResources();
  if (!resources || Object.values(ResourceType).some((type) =>
    !Number.isFinite(resources[type]) || resources[type] < 0)) return null;
  return { ...resources };
}
