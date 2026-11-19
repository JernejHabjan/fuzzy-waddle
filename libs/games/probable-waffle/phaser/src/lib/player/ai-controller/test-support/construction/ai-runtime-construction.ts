import type { ConstructionAuthorityRecord } from "../../../../entity/components/construction/construction-authority-record";
import type { AiRuntimeCreatedActor } from "../harness/capture/ai-runtime-created-actor";

/** Detached native lifecycle and resource attempt. Missing history/global callback ownership remains explicit. */
export type AiRuntimeConstruction = ConstructionAuthorityRecord & {
  readonly site: AiRuntimeCreatedActor;
  readonly clockTick: number | null;
  readonly sceneActive: boolean;
};
