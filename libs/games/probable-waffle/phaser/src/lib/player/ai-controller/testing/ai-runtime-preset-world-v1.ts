import type { ObjectNames, ResearchType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

import type { AiRuntimePresetControlV1 } from "./ai-runtime-preset-control-v1";
import type { AiRuntimeConstructionOrderV1 } from "./ai-runtime-construction-order-v1";
import type { AiRuntimeProtectedRouteV1 } from "./ai-runtime-protected-route-v1";
import type { AiRuntimeReceiptFault } from "./ai-runtime-receipt-fault";

/** Test-authored world inputs applied through real scene actor and resource services before tick zero. */
export interface AiRuntimePresetWorldV1 {
  readonly fixtureId: string;
  /** Consumer-local receipt/checkpoint delay; shared native application/capture is never withheld. */
  readonly receiptFault?: AiRuntimeReceiptFault;
  /** Production recipes require the authored faction graph, including the ordinary map's indexed actors. */
  readonly requireFactionRoster?: true;
  /** Real base-layer terrain before navigation initialization; only explicit diagnostic presets can apply these. */
  readonly terrainPatches?: readonly { readonly x: number; readonly y: number; readonly terrain: "grass" | "water";
    readonly blocked: boolean }[];
  /** Keep real initial actor/body footprints legal when masking a constrained world; no later terrain edits. */
  readonly terrainPreserveFootprints?: true;
  /** Test-only finite query outage for original actors; never changes ownership, terrain or strategic defeat state. */
  readonly routeOutages?: readonly { readonly id: string; readonly fromTick: number; readonly throughTick: number;
    readonly fixtureActorIds: readonly string[];
    /** Omitted preserves legacy null failures; pending retains at most 32 calls until the fixed end or shutdown. */
    readonly mode?: "null" | "pending" | "error" }[];
  readonly provenance: {
    readonly sourceRevision: string;
    readonly fixtureDigest: string;
  };
  readonly actors: readonly {
    readonly fixtureActorId: string;
    readonly actorName: ObjectNames;
    readonly owner: number | null;
    readonly position: { readonly x: number; readonly y: number; readonly z: number };
  }[];
  /** Bind a unique inherited actor without creating/moving it. Neutral resources require an exact logical-world position. */
  readonly existingActorBindings?: readonly {
    readonly fixtureActorId: string;
    readonly actorName: ObjectNames;
    readonly owner: number | null;
    readonly position?: { readonly x: number; readonly y: number; readonly z: number };
  }[];
  readonly resourceGrants: readonly {
    readonly playerNumber: number;
    readonly amounts: Partial<Record<ResourceType, number>>;
  }[];
  /** Nearly depleted physical sources, applied before native work; independent of the player's cash bank. */
  readonly sourceStocks?: readonly { readonly fixtureActorId: string; readonly amount: number }[];
  /** Native saved-component initial durability; not a scored attack or evidence of damage inflicted by the AI. */
  readonly healthStarts?: readonly { readonly fixtureActorId: string; readonly healthPermille: number;
    readonly armourPermille: number }[];
  /** Normal pre-tick shared build commands; roles bind actual unfinished sites for later loss/recovery controls. */
  readonly constructionOrders?: readonly AiRuntimeConstructionOrderV1[];
  /** Test-owned static clearance probes, captured at setup and every native placement; never planner input. */
  readonly protectedRoutes?: readonly AiRuntimeProtectedRouteV1[];
  /** Exact pre-tick balances, applied after grants/queue charges and before any AI observation. */
  readonly resourceStarts?: readonly {
    readonly playerNumber: number;
    readonly amounts: Partial<Record<ResourceType, number>>;
  }[];
  readonly queues?: readonly {
    readonly producerFixtureActorId: string;
    readonly actorName: ObjectNames;
    readonly count: number;
  }[];
  /** Paid research admitted after production seeds through the ordinary shared command authority. */
  readonly researchQueues?: readonly {
    readonly producerFixtureActorId: string;
    readonly researchType: ResearchType;
  }[];
  readonly initialOrders?: readonly {
    readonly workerFixtureActorId: string;
    readonly sourceFixtureActorId: string;
    readonly kind: "gather";
  }[];
  /** Normal shared commands owned by an explicit test controller, never injected AI selections. */
  /** Ordinary owned rally policy for initial producers and later actual completed replacements. */
  readonly productionRallies?: readonly {
    readonly producerObjectName: ObjectNames;
    readonly owner: number;
    readonly targetFixtureActorId: string;
  }[];
  readonly controls?: readonly AiRuntimePresetControlV1[];
  readonly events?: readonly {
    readonly id: string;
    readonly tick: number;
    /** Cancellation uses native unfinished-site teardown/refund; it is not a relayed multiplayer cancel command. */
    readonly kind: "destroy_owned_actor" | "cancel_unfinished_site" | "damage_owned_actor" | "destroy_ai_site";
    /** Nonlethal native perturbation for hidden-durability controls, never credited as AI damage. */
    readonly damage?: number;
    readonly owner: number;
    readonly objectName: ObjectNames;
    /** Pin a scheduled loss to its original authored actor, rather than a later same-type replacement. */
    readonly fixtureActorId?: string;
  }[];
}
