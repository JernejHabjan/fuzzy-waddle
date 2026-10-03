import type { ObjectNames, ResearchType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

/** Test-authored world inputs applied through real scene actor and resource services before tick zero. */
export interface AiRuntimePresetWorldV1 {
  readonly fixtureId: string;
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
  readonly events?: readonly {
    readonly id: string;
    readonly tick: number;
    readonly kind: "destroy_owned_actor";
    readonly owner: number;
    readonly objectName: ObjectNames;
  }[];
}
