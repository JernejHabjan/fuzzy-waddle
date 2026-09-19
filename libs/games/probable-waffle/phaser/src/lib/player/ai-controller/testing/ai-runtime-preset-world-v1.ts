import type { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

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
    readonly owner: number;
    readonly position: { readonly x: number; readonly y: number; readonly z: number };
  }[];
  readonly resourceGrants: readonly {
    readonly playerNumber: number;
    readonly amounts: Partial<Record<ResourceType, number>>;
  }[];
  readonly queues?: readonly {
    readonly producerFixtureActorId: string;
    readonly actorName: ObjectNames;
    readonly count: number;
  }[];
  readonly events?: readonly {
    readonly id: string;
    readonly tick: number;
    readonly kind: "destroy_owned_actor";
    readonly owner: number;
    readonly objectName: ObjectNames;
  }[];
}
