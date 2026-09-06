import type { ActorId, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { ObjectNames, ResearchType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { SpellType } from "../../../entity/components/combat/spell-type";
import type {
  AiClaimId,
  AiDemandId,
  AiEffectId,
  AiIntentId,
  AiPlanId,
  AiQueryId,
  AiSimulationTick
} from "./ai-core-types";
import type { AiServiceLaneV1 } from "./ai-lane-contracts";

/** Preconditions are evaluated against the committed observation, never the live world. */
export type AiIntentPreconditionV1 =
  | { readonly kind: "actor_exists"; readonly actorId: ActorId }
  | { readonly kind: "resource_at_least"; readonly resourceType: ResourceType; readonly amount: number }
  | { readonly kind: "supply_at_least"; readonly amount: number }
  | { readonly kind: "capability_supported"; readonly capabilityId: string }
  | { readonly kind: "query_ready"; readonly queryId: AiQueryId }
  | { readonly kind: "target_visible"; readonly actorId: ActorId }
  | { readonly kind: "plan_active"; readonly planId: AiPlanId };

/** Claims make conflicts and capacity consumption explicit before dispatch. */
export type AiIntentClaimV1 =
  | { readonly claimId: AiClaimId; readonly kind: "actor"; readonly actorId: ActorId }
  | {
      readonly claimId: AiClaimId;
      readonly kind: "resource";
      readonly resourceType: ResourceType;
      readonly amount: number;
    }
  | {
      readonly claimId: AiClaimId;
      readonly kind: "production_slot";
      readonly producerId: ActorId;
      readonly slot: number;
    }
  | { readonly claimId: AiClaimId; readonly kind: "site"; readonly siteKey: string }
  | { readonly claimId: AiClaimId; readonly kind: "cargo_seat"; readonly transportId: ActorId; readonly seats: number }
  | { readonly claimId: AiClaimId; readonly kind: "effect"; readonly effectId: AiEffectId };

interface AiIntentBaseV1 {
  readonly intentId: AiIntentId;
  readonly effectId: AiEffectId;
  readonly planId: AiPlanId;
  readonly demandId: AiDemandId | null;
  readonly lane: AiServiceLaneV1;
  readonly proposedTick: AiSimulationTick;
  readonly urgencyClass: number;
  readonly utility: number;
  readonly preconditions: readonly AiIntentPreconditionV1[];
  readonly claims: readonly AiIntentClaimV1[];
  readonly reasonCode: string;
}

/** Discriminated pure action proposal; the runtime adapter alone translates accepted intents to commands. */
export type AiIntentV1 =
  | (AiIntentBaseV1 & {
      readonly kind: "assign_gatherers";
      readonly actorIds: readonly ActorId[];
      readonly resourceType: ResourceType;
      readonly sourceActorId: ActorId | null;
    })
  | (AiIntentBaseV1 & {
      readonly kind: "construct";
      readonly builderIds: readonly ActorId[];
      readonly objectName: ObjectNames;
      readonly logicalPosition: Vector3Simple;
      readonly siteKey: string;
    })
  | (AiIntentBaseV1 & { readonly kind: "produce"; readonly producerId: ActorId; readonly objectName: ObjectNames })
  | (AiIntentBaseV1 & { readonly kind: "research"; readonly producerId: ActorId; readonly researchType: ResearchType })
  | (AiIntentBaseV1 & {
      readonly kind: "move" | "scout";
      readonly actorIds: readonly ActorId[];
      readonly logicalPosition: Vector3Simple;
    })
  | (AiIntentBaseV1 & {
      readonly kind: "attack";
      readonly actorIds: readonly ActorId[];
      readonly targetActorId: ActorId | null;
      readonly targetPosition: Vector3Simple | null;
    })
  | (AiIntentBaseV1 & { readonly kind: "board"; readonly actorIds: readonly ActorId[]; readonly transportId: ActorId })
  | (AiIntentBaseV1 & {
      readonly kind: "unload";
      readonly transportId: ActorId;
      readonly logicalPosition: Vector3Simple;
    })
  | (AiIntentBaseV1 & {
      readonly kind: "heal" | "repair" | "tend";
      readonly actorIds: readonly ActorId[];
      readonly targetActorId: ActorId;
    })
  | (AiIntentBaseV1 & {
      readonly kind: "cast";
      readonly actorId: ActorId;
      readonly spellType: SpellType;
      readonly targetActorId: ActorId | null;
      readonly targetPosition: Vector3Simple | null;
    })
  | (AiIntentBaseV1 & { readonly kind: "stop"; readonly actorIds: readonly ActorId[] })
  | (AiIntentBaseV1 & { readonly kind: "cancel"; readonly actorId: ActorId; readonly queueIndex: number })
  | (AiIntentBaseV1 & { readonly kind: "concede"; readonly reason: string });

/** Stable reason for arbitration; accepted and rejected paths share the same envelope. */
export type AiIntentDecisionV1 =
  | { readonly outcome: "accepted"; readonly intent: AiIntentV1; readonly reason: "accepted" }
  | {
      readonly outcome: "rejected";
      readonly intent: AiIntentV1;
      readonly reason:
        | "invalid_numeric_input"
        | "precondition_failed"
        | "claim_conflict"
        | "resource_conflict"
        | "profile_limit";
      readonly detail: string;
    };
