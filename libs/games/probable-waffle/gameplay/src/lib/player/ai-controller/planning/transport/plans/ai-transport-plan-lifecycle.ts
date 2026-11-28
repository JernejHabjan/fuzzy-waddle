import type { AiTransportState } from "../../../contracts/state/ai-state-contracts";

export type AiTransportPlanWithLifecycle = AiTransportState & {
  readonly lifecycle: NonNullable<AiTransportState["lifecycle"]>;
};
