import type { AiIntentV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { GameCommandInput } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiGameCommandCorrelation, GameCommandDispatchReceipt } from
  "../../world/services/multiplayer/command-bus.service";

export const AI_INTENT_COMMAND_DISPATCH_EVENT = "ai-intent-command-dispatch";

/** Local diagnostic scope around the actual bus call; never persisted or sent over the relay. */
export type AiIntentCommandDispatchEvent = {
  readonly playerNumber: number;
  readonly correlation: AiGameCommandCorrelation;
} & (
  | {
    readonly kind: "requested";
    readonly command: GameCommandInput;
    /** The arbiter's accepted claims, before any command callback can apply or retire them. */
    readonly claims: AiIntentV1["claims"];
    readonly proposedTick: number;
  }
  | { readonly kind: "finished"; readonly receipt: GameCommandDispatchReceipt }
  | { readonly kind: "threw" }
);
