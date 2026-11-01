import type { AiRuntimeProposalOrder } from "./ai-runtime-proposal-order";
import type { AiRuntimeRecoverySetup } from "./ai-runtime-recovery-setup";
import type { AiRuntimeBrainFaultEvent } from "./create-ai-runtime-brain-hooks";
import type { AiRuntimePresetControlEvent } from "./ai-runtime-preset-control-event";
import type { AiRuntimeQueueCompletion } from "./ai-runtime-queue-completion";
import type { AiRuntimeCreatedActor } from "./ai-runtime-created-actor";
import type { AiRuntimeQueueMutation } from "./ai-runtime-queue-mutation";
import type {
  GameCommand,
  GameCommandOutcome,
  ResearchType,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionQueue } from "./ai-runtime-production-queue";
import type { AiIntentCommandDispatchEvent } from "../ai-intent-command-dispatch-event";
import type { AiRuntimeQueueResource } from "./ai-runtime-queue-resource";

import type { AiRuntimeQueueProgress } from "./ai-runtime-queue-progress";
import type { AiDecisionDispatchEvent } from "../ai-decision-dispatch-event";
import type { AiRuntimeProductionBoundaryState } from "./ai-runtime-production-boundary-state";
import type { AiRuntimeProductionSpatial } from "./ai-runtime-production-spatial";
import type { AiRuntimeConstruction } from "./ai-runtime-construction";
import type { AiRuntimeRecipientMutation } from "./ai-runtime-recipient-mutation";
import type { AiResourceInputRead } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/planning/ai-resource-input-read";
import type { AiObservation } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { AiRuntimeUnspentClaimsSnapshot } from "./ai-runtime-unspent-claims-snapshot";
import type { AiRuntimeQueueCatalogEntry } from "./ai-runtime-queue-catalog-entry";
import type { AiRuntimeDamage } from "./ai-runtime-damage";
import type { AiRuntimeTacticalBoundary } from "./ai-runtime-tactical-boundary";
import type { AiRuntimeCombatOperation } from "./ai-runtime-combat-operation";
import type { AiRuntimeAuthorityDelivery } from "./ai-runtime-authority-delivery";

/** Raw authority callbacks in observer order. No resource event is labelled a payment/refund without item provenance. */
export type AiRuntimeProductionFact = {
  readonly sequence: number;
  readonly tick: number;
  readonly playerNumber: number;
  /** Callback-time state after the diagnostic ledger update; optional only for older/synthetic records. */
  readonly boundaryState?: AiRuntimeProductionBoundaryState;
} & (
  | {
      readonly kind: "resource_input_read";
      readonly read: AiResourceInputRead;
      readonly resources: AiObservation["resources"];
      /** Detached ownership before the native ledger read; absent legacy evidence must never mean zero cash claims. */
      readonly unspentClaimsAtRead?: AiRuntimeUnspentClaimsSnapshot;
    }
  | {
      readonly kind: "resource_need_fence";
      readonly reason: string;
      /** Exact consumed read only at decision start; still closes every earlier selected generation. */
      readonly incomingRead?: AiResourceInputRead;
    }
  | { readonly kind: "preset_control"; readonly control: AiRuntimePresetControlEvent }
  | { readonly kind: "proposal_order"; readonly order: AiRuntimeProposalOrder }
  | { readonly kind: "recovery_setup"; readonly recovery: AiRuntimeRecoverySetup }
  | { readonly kind: "brain_fault"; readonly fault: AiRuntimeBrainFaultEvent }
  | { readonly kind: "authority_delivery"; readonly delivery: AiRuntimeAuthorityDelivery }
  | { readonly kind: "native_damage"; readonly damage: AiRuntimeDamage }
  | { readonly kind: "native_combat"; readonly operation: AiRuntimeCombatOperation }
  | { readonly kind: "recipient_resources_installed"; readonly resources: Record<ResourceType, number> | null }
  | { readonly kind: "recipient_resource_mutation"; readonly mutation: AiRuntimeRecipientMutation }
  | {
      readonly kind: "outcome";
      readonly outcome: GameCommandOutcome;
      /** Sample before this outcome changes pending ownership; queue/cash are already at observer time. */
      readonly boundaryStateBefore?: AiRuntimeProductionBoundaryState;
      /** Bus intended execution tick only on dispatched callbacks; the enclosing tick is observation time. */
      readonly scheduledTick: number | null;
    }
  | {
      readonly kind: "decision_selected";
      readonly decision: AiDecisionDispatchEvent;
      /** Explicit combat capture only. Privileged diagnostics cannot become consumed AI input. */
      readonly tacticalBoundary?: AiRuntimeTacticalBoundary;
      /** Detached ownership before this selection adds/retires claims; boundaryState carries the accepting frame. */
      readonly unspentClaimsBeforeSelection?: AiRuntimeUnspentClaimsSnapshot;
    }
  | { readonly kind: "construction_authority"; readonly construction: AiRuntimeConstruction }
  | { readonly kind: "spatial_authority"; readonly spatial: AiRuntimeProductionSpatial }
  | {
      readonly kind: "intent_dispatch";
      readonly event: AiIntentCommandDispatchEvent;
      /** Exact pre-callback ledger state; rejected receipt releases selected claims before the after sample. */
      readonly boundaryStateBefore?: AiRuntimeProductionBoundaryState;
    }
  | { readonly kind: "queue_completion"; readonly completion: AiRuntimeQueueCompletion }
  | {
      readonly kind: "actor_registered";
      readonly actor: AiRuntimeCreatedActor;
      readonly snapshotRestoreInProgress: boolean;
    }
  | {
      readonly kind: "queue_mutation";
      readonly mutation: AiRuntimeQueueMutation;
      /** Operation-time producer definitions. A later poll cannot supply the earlier effective level/prices. */
      readonly definitionCatalog?: readonly AiRuntimeQueueCatalogEntry[];
      readonly definitionGaps?: readonly string[];
    }
  | { readonly kind: "queue_progress"; readonly progress: AiRuntimeQueueProgress }
  | { readonly kind: "queue_resource"; readonly resource: AiRuntimeQueueResource }
  /** Delivery observation can follow component application; this is explicitly not a dispatch/request timestamp. */
  | { readonly kind: "command_delivered"; readonly command: GameCommand }
  | {
      readonly kind: "resources_applied";
      readonly action: "resource.added" | "resource.removed";
      readonly amounts: Readonly<Partial<Record<ResourceType, number>>>;
      /** Last observed shared balance. This is not an operation-scoped sample before the underlying payment/refund. */
      readonly before: Readonly<Record<ResourceType, number>>;
      readonly after: Readonly<Record<ResourceType, number>>;
      readonly balanceMatches: boolean;
    }
  | { readonly kind: "queue_changed"; readonly queue: AiRuntimeProductionQueue }
  | { readonly kind: "research_completed"; readonly researchType: ResearchType }
  | {
      readonly kind: "actor_unregistered";
      readonly actorId: string;
      readonly objectName: string;
      /** Native death/readiness at removal, distinct from missing future index membership. Legacy omission stays unavailable. */
      readonly actor?: AiRuntimeCreatedActor;
    }
);
