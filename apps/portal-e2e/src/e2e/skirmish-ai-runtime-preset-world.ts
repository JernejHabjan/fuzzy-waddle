// prettier-ignore
import type { AiRuntimePresetWorldV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-preset-world-v1";
// prettier-ignore
import type { AiRuntimePresetControlV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-preset-control-v1";
export interface RuntimePresetWorldV1 {
  readonly fixtureId: string;
  readonly requireFactionRoster?: true;
  readonly actors: readonly {
    readonly fixtureActorId: string;
    readonly actorName: string;
    readonly owner: number | null;
    readonly position: { readonly x: number; readonly y: number; readonly z: number };
  }[];
  /** Bind a unique actual inherited owned actor; this never creates, moves or rewrites it. */
  readonly existingActorBindings?: readonly {
    readonly fixtureActorId: string;
    readonly actorName: string;
    readonly owner: number;
  }[];
  readonly resourceGrants: readonly {
    readonly playerNumber: number;
    readonly amounts: Readonly<Record<string, number>>;
  }[];
  readonly sourceStocks?: AiRuntimePresetWorldV1["sourceStocks"];
  readonly constructionOrders?: AiRuntimePresetWorldV1["constructionOrders"];
  readonly protectedRoutes?: AiRuntimePresetWorldV1["protectedRoutes"];
  /** Exact pre-tick balances applied through resource events after grants and queue charges. */
  readonly resourceStarts?: readonly {
    readonly playerNumber: number;
    readonly amounts: Readonly<Record<string, number>>;
  }[];
  readonly queues?: readonly {
    readonly producerFixtureActorId: string;
    readonly actorName: string;
    readonly count: number;
  }[];
  /** Research seeds use normal priced shared commands after the production seeds. */
  readonly researchQueues?: readonly {
    readonly producerFixtureActorId: string;
    readonly researchType: string;
  }[];
  readonly initialOrders?: readonly {
    readonly workerFixtureActorId: string;
    readonly sourceFixtureActorId: string;
    readonly kind: "gather";
  }[];
  readonly productionRallies?: AiRuntimePresetWorldV1["productionRallies"];
  readonly controls?: readonly AiRuntimePresetControlV1[];
  readonly events?: readonly {
    readonly id: string;
    readonly tick: number;
    readonly kind: "destroy_owned_actor" | "cancel_unfinished_site";
    readonly owner: number;
    readonly objectName: string;
    readonly fixtureActorId?: string;
  }[];
}
