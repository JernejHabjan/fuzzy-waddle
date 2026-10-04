import type { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiIntentV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { AiDecisionIdentity } from "../ai-decision-identity";

/** Selected resource ownership reconciled by actual callbacks, independently of the pending command diagnostic. */
export interface AiRuntimeUnspentClaimsV1 {
  /** Null means incomplete ownership; callers must not add pending claims or replace absence with zero. */
  readonly resources: Readonly<Record<ResourceType, number>> | null;
  readonly entries: readonly {
    readonly identity: AiDecisionIdentity;
    readonly intent: AiIntentV1;
    readonly commandId: string | null;
    /** queue_liability transfers the claim to real pay-over-time obligations without counting it twice. */
    readonly state: "selected" | "admitted" | "paid" | "queue_liability" | "released";
  }[];
  readonly gaps: readonly string[];
}
