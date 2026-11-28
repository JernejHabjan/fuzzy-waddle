import type Phaser from "phaser";
import { type ResourceType, type PlayerStateResources } from "@fuzzy-waddle/probable-waffle-protocol";
import { emitResource, getPlayer, isSnapshotApplyInProgress } from "../../../data/scene-data";

/** Scene-local gameplay notification, independent of optional diagnostic capture. Amounts are actually credited units. */
export const GATHERED_RESOURCE_CREDITED = "gathered_resource_credited";

/** Credits a native harvest receipt, then reports only a confirmed player balance increase. Grants never use this path. */
export function creditGatheredResource(
  scene: Phaser.Scene,
  playerNumber: number | undefined,
  resourceType: ResourceType,
  amounts: Partial<PlayerStateResources>
): void {
  const amount = amounts[resourceType] ?? 0;
  const player = getPlayer(scene, playerNumber);
  const before = player?.getResources?.()[resourceType];
  emitResource(scene, "resource.added", amounts, playerNumber);
  const after = player?.getResources?.()[resourceType];
  if (
    playerNumber !== undefined &&
    Number.isFinite(amount) &&
    amount > 0 &&
    typeof before === "number" &&
    typeof after === "number" &&
    after === before + amount &&
    isSnapshotApplyInProgress?.(scene) === false
  ) {
    scene.events.emit(GATHERED_RESOURCE_CREDITED, playerNumber, resourceType, amount);
  }
}
