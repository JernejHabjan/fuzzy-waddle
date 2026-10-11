import type { ResourceCargoSample } from "../../../entity/components/resource/resource-cargo-sample";
import type { ResourceCargoChange } from "../../../entity/components/resource/resource-cargo-change";
import type { ResourceServiceEvent } from "../../../entity/components/resource/resource-service-event";
import type { AiRuntimeCreatedActorV1 } from "./ai-runtime-created-actor-v1";

/** Detached cargo/credit boundaries. IDs are capture-local weak handles; no later order or restored pile supplies lineage. */
export type AiRuntimeResourceServiceV1 = {
  readonly kind: "resource_service";
  readonly source: AiRuntimeCreatedActorV1;
  readonly target: AiRuntimeCreatedActorV1 | null;
  readonly sourceInCaptureScene: boolean;
  readonly targetInCaptureScene: boolean | null;
  readonly cargoId: number | null;
  readonly attemptId: number | null;
  readonly transferId: number | null;
  readonly lifetimeValid: boolean;
} & (
  | { readonly phase: "cargo_changed"; readonly change: Pick<ResourceCargoChange, "reason" | "resourceType" | "delta">;
    readonly before: ResourceCargoSample; readonly after: ResourceCargoSample }
  | { readonly phase: "cargo_started"; readonly cargo: ResourceCargoSample }
  | { readonly phase: "cargo_offered"; readonly cargo: ResourceCargoSample }
  | { readonly phase: "resource_credit"; readonly emissionRestoreInProgress: boolean | null;
    /** Exact successful native application join; null/legacy omission cannot borrow nearby money events. */
    readonly operationId?: number | null } &
    Omit<Extract<ResourceServiceEvent, { kind: "resource_credit" }>,
      "kind" | "actor" | "target" | "context" | "snapshotRestoreInProgress" | "application">
);
