import type { AiTransportState } from "../contracts/ai-brain-state";

export type AiTransportPlanWithLifecycle = AiTransportState & {
  readonly lifecycle: NonNullable<AiTransportState["lifecycle"]>;
};
