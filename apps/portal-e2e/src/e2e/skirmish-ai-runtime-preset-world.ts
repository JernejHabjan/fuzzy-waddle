export interface RuntimePresetWorldV1 {
  readonly fixtureId: string;
  readonly actors: readonly {
    readonly fixtureActorId: string;
    readonly actorName: string;
    readonly owner: number;
    readonly position: { readonly x: number; readonly y: number; readonly z: number };
  }[];
  readonly resourceGrants: readonly {
    readonly playerNumber: number;
    readonly amounts: Readonly<Record<string, number>>;
  }[];
  readonly queues?: readonly {
    readonly producerFixtureActorId: string;
    readonly actorName: string;
    readonly count: number;
  }[];
  readonly events?: readonly {
    readonly id: string;
    readonly tick: number;
    readonly kind: "destroy_owned_actor";
    readonly owner: number;
    readonly objectName: string;
  }[];
}
