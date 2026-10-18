import type { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";

/** Test controller inputs, separate from selected AI intents. Identity is allocated by the bus at application. */
export interface AiRuntimePresetControlV1 {
  readonly id: string;
  readonly requestTick: number;
  readonly applicationTick: number;
  readonly producerFixtureActorId: string;
  readonly action:
    | { readonly kind: "rally"; readonly targetFixtureActorId: string }
    | { readonly kind: "produce"; readonly actorName: ObjectNames }
    | { readonly kind: "move"; readonly worldPosition: Vector3Simple }
    | { readonly kind: "move_to_actor"; readonly targetFixtureActorId: string }
    | { readonly kind: "attack"; readonly targetFixtureActorId: string }
    | { readonly kind: "cancel_production"; readonly setupQueueIndex: number };
}
