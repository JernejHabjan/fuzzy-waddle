import type { AiRuntimeUnspentClaimsV1 } from "./ai-runtime-unspent-claims-v1";
import type { AiIntentCommandDispatchEvent } from "../ai-intent-command-dispatch-event";
import type { GameCommandOutcome } from "@fuzzy-waddle/probable-waffle-protocol";

/** Mutable capture-local ownership entry; none of these handles enter saved planner state. */
export type AiRuntimeUnspentClaimEntry = {
  -readonly [Key in keyof AiRuntimeUnspentClaimsV1["entries"][number]]: AiRuntimeUnspentClaimsV1["entries"][number][Key];
} & {
  request?: Extract<AiIntentCommandDispatchEvent, { kind: "requested" }>;
  admission?: GameCommandOutcome;
  paymentOperation?: number;
  paymentCallback?: boolean;
};
