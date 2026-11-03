import type { AiRuntimeUnspentClaimsSnapshot } from "./ai-runtime-unspent-claims-snapshot";
import type { AiIntentCommandDispatchEvent } from "../../../commands/ai-intent-command-dispatch-event";
import type { GameCommandOutcome } from "@fuzzy-waddle/probable-waffle-protocol";

/** Mutable capture-local ownership entry; none of these handles enter saved planner state. */
export type AiRuntimeUnspentClaimEntry = {
  -readonly [Key in keyof AiRuntimeUnspentClaimsSnapshot["entries"][number]]: AiRuntimeUnspentClaimsSnapshot["entries"][number][Key];
} & {
  request?: Extract<AiIntentCommandDispatchEvent, { kind: "requested" }>;
  admission?: GameCommandOutcome;
  paymentOperation?: number;
  paymentCallback?: boolean;
};
