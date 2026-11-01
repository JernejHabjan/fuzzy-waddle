// prettier-ignore
import type { AiRuntimePresetWorld } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-preset-world";
// prettier-ignore
import type { AiRuntimePresetControl } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-preset-control";
export interface RuntimePresetWorld {
  readonly fixtureId: string;
  /** Permutes real emitted proposer batches before arbitration; never supplies fixture intents. */
  readonly proposalOrder?: "forward" | "reverse";
  /** Definition-priced scarce recovery, applied only at pre-tick setup. */
  readonly recoveryStart?: "one_worker" | "bootstrap" | "infeasible";
  readonly requireFactionRoster?: true;
  readonly terrainPatches?: AiRuntimePresetWorld["terrainPatches"];
  readonly terrainPreserveFootprints?: true;
  readonly routeOutages?: AiRuntimePresetWorld["routeOutages"];
  readonly receiptFault?: AiRuntimePresetWorld["receiptFault"];
  readonly brainFault?: AiRuntimePresetWorld["brainFault"];
  readonly actors: readonly {
    readonly fixtureActorId: string;
    readonly actorName: string;
    readonly owner: number | null;
    readonly position: { readonly x: number; readonly y: number; readonly z: number };
  }[];
  /** Neutral inherited sources require an exact logical-world position; binding never creates or moves an actor. */
  readonly existingActorBindings?: readonly {
    readonly fixtureActorId: string;
    readonly actorName: string;
    readonly owner: number | null;
    readonly position?: { readonly x: number; readonly y: number; readonly z: number };
  }[];
  readonly resourceGrants: readonly {
    readonly playerNumber: number;
    readonly amounts: Readonly<Record<string, number>>;
  }[];
  readonly sourceStocks?: AiRuntimePresetWorld["sourceStocks"];
  readonly healthStarts?: AiRuntimePresetWorld["healthStarts"];
  readonly constructionOrders?: AiRuntimePresetWorld["constructionOrders"];
  readonly protectedRoutes?: AiRuntimePresetWorld["protectedRoutes"];
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
  readonly productionRallies?: AiRuntimePresetWorld["productionRallies"];
  readonly controls?: readonly AiRuntimePresetControl[];
  readonly events?: readonly {
    readonly id: string;
    readonly tick: number;
    readonly kind: "destroy_owned_actor" | "cancel_unfinished_site" | "damage_owned_actor" | "destroy_ai_site";
    readonly damage?: number;
    readonly owner: number;
    readonly objectName: string;
    readonly fixtureActorId?: string;
  }[];
}
