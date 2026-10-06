import type Phaser from "phaser";
import type { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { ConstructCommand, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";

export const PRODUCTION_SPATIAL_AUTHORITY_EVENT = "production-spatial-authority";

/** Local native check results, never saved/relayed. A legal footprint or spawn is not a complete route. */
export type ProductionSpatialAuthorityEvent =
  | { readonly kind: "placement"; readonly command: ConstructCommand; readonly site: Phaser.GameObjects.GameObject;
    readonly footprint: readonly Vector2Simple[]; readonly legal: boolean;
    /** Detached price already checked by shared application; supplies no actual payment authority. */
    readonly admissionCost: Readonly<Partial<Record<ResourceType, number>>> }
  | { readonly kind: "spawn"; readonly producer: Phaser.GameObjects.GameObject; readonly item: UnifiedQueueItem;
    readonly waterUnit: boolean; readonly tile: Vector2Simple | null; readonly position: Vector3Simple | null };
