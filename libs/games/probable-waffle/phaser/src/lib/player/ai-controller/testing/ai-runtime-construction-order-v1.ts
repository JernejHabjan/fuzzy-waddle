import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";

/** Pre-tick ordinary shared build request. The new role binds its actual applied site, never a finished prefab. */
export interface AiRuntimeConstructionOrderV1 {
  readonly fixtureActorId: string;
  readonly actorName: ObjectNames;
  readonly builderFixtureActorIds: readonly string[];
  /** Logical world position; the ordinary isometric conversion supplies the shared command's tile. */
  readonly position: Vector3Simple;
}
