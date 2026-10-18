import type { ObjectNames, ResearchType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

import type { AiRuntimePresetControlV1 } from "./ai-runtime-preset-control-v1";
import type { AiRuntimeConstructionOrderV1 } from "./ai-runtime-construction-order-v1";
import type { AiRuntimeProtectedRouteV1 } from "./ai-runtime-protected-route-v1";

/** Test-authored world inputs applied through real scene actor and resource services before tick zero. */
export interface AiRuntimePresetWorldV1 {
  readonly fixtureId: string;
  /** Production recipes require the authored faction graph, including the ordinary map's indexed actors. */
  readonly requireFactionRoster?: true;
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
  /** Bind a unique actual inherited owned actor; this never creates, moves or rewrites it. */
  readonly existingActorBindings?: readonly {
    readonly fixtureActorId: string;
    readonly actorName: ObjectNames;
    readonly owner: number;
  }[];
  readonly resourceGrants: readonly {
    readonly playerNumber: number;
    readonly amounts: Partial<Record<ResourceType, number>>;
  }[];
  /** Nearly depleted physical sources, applied before native work; independent of the player's cash bank. */
  readonly sourceStocks?: readonly { readonly fixtureActorId: string; readonly amount: number }[];
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
    readonly kind: "destroy_owned_actor" | "cancel_unfinished_site";
    readonly owner: number;
    readonly objectName: ObjectNames;
    /** Pin a scheduled loss to its original authored actor, rather than a later same-type replacement. */
    readonly fixtureActorId?: string;
  }[];
}
