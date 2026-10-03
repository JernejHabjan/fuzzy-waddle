import type { AiTransportStateV1 } from "../contracts/ai-brain-state-v1";

export type AiTransportPlanWithLifecycle = AiTransportStateV1 & {
  readonly lifecycle: NonNullable<AiTransportStateV1["lifecycle"]>;
};
