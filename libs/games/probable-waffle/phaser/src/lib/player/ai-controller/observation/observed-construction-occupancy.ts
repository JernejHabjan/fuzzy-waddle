import type Phaser from "phaser";
import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { AiObservedActorV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { getTileCoordsUnderObject } from "../../../library/tile-under-object";

/** Shared placement rejects all overlapping bodies, including actors that do not block static navigation.
 * Project only the already admitted fair actors; hidden and last-seen live positions must never enter this set.
 */
export function observedConstructionOccupancy(
  tilemap: Phaser.Tilemaps.Tilemap,
  actors: readonly AiObservedActorV1[],
  liveById: ReadonlyMap<ActorId, Phaser.GameObjects.GameObject>
): ReadonlySet<string> {
  const occupied = new Set<string>();
  for (const actor of actors) {
    if (actor.visibility !== "owned" && actor.visibility !== "visible") continue;
    const live = liveById.get(actor.actorId);
    if (!live) continue;
    for (const tile of getTileCoordsUnderObject(tilemap, live)) occupied.add(`${tile.x},${tile.y}`);
  }
  return occupied;
}
