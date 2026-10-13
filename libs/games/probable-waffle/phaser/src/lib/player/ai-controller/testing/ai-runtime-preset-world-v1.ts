import type { ObjectNames, ResearchType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

import type { AiRuntimePresetControlV1 } from "./ai-runtime-preset-control-v1";

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
    readonly kind: "destroy_owned_actor";
    readonly owner: number;
    readonly objectName: ObjectNames;
    /** Pin a scheduled loss to its original authored actor, rather than a later same-type replacement. */
    readonly fixtureActorId?: string;
  }[];
}
