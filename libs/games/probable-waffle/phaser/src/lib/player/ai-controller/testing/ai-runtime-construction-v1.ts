import type { ConstructionAuthorityRecord } from "../../../entity/components/construction/construction-authority-record";
import type { AiRuntimeCreatedActorV1 } from "./ai-runtime-created-actor-v1";

/** Detached native lifecycle and resource attempt. Missing history/global callback ownership remains explicit. */
export type AiRuntimeConstructionV1 = ConstructionAuthorityRecord & {
  readonly site: AiRuntimeCreatedActorV1;
  readonly clockTick: number | null;
  readonly sceneActive: boolean;
};
