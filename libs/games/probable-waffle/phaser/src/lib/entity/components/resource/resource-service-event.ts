import type Phaser from "phaser";
import type { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { ResourceCargoSample } from "./resource-cargo-sample";
import type { ResourceCargoChange } from "./resource-cargo-change";
import type { ResourceTransferContext } from "./resource-transfer-context";

/** Local, unsaved evidence. Native return, offered pile and scoped applied balance remain independent facts. */
export type ResourceServiceEvent = { readonly actor: Phaser.GameObjects.GameObject } & (
  | { readonly kind: "cargo_started"; readonly cargoOwner: object; readonly execution?: object;
    readonly target: Phaser.GameObjects.GameObject; readonly cargo: ResourceCargoSample }
  | { readonly kind: "cargo_changed"; readonly cargoOwner: object; readonly change: ResourceCargoChange;
    readonly before: ResourceCargoSample; readonly after: ResourceCargoSample }
  | { readonly kind: "cargo_offered"; readonly context: ResourceTransferContext;
    readonly target: Phaser.GameObjects.GameObject; readonly cargo: ResourceCargoSample }
  | { readonly kind: "resource_credit"; readonly context?: ResourceTransferContext;
    /** Transient exact native mutation token; only the scene capture assigns its local operation ID. */
    readonly application?: object;
    readonly target: Phaser.GameObjects.GameObject; readonly resourceType: ResourceType | null; readonly amount: number;
    readonly channel: "immediate" | "drop_off"; readonly ownerArgument: number | null; readonly beneficiary: number | null;
    readonly status: "returned" | "threw" | "campaign_suppressed";
    readonly before: Record<ResourceType, number> | null; readonly after: Record<ResourceType, number> | null;
    readonly callbackAmounts: Partial<Record<ResourceType, number>> | null; readonly callbackCount: number;
    readonly interference: boolean; readonly snapshotRestoreInProgress: boolean | null; readonly balanceMatches: boolean }
);
