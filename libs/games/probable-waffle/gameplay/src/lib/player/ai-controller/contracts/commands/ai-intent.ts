import type { ActorId, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { ObjectNames, ResearchType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { SpellType } from "../../../../entity/components/combat/spell-type";
import type {
  AiClaimId,
  AiDemandId,
  AiEffectId,
  AiIntentId,
  AiPlanId,
  AiQueryId,
  AiSimulationTick
} from "../ai-core-types";
import type { AiServiceLane } from "../execution/ai-lane-contracts";

/** Preconditions are evaluated against the committed observation, never the live world. */
export type AiIntentPrecondition =
  | { readonly kind: "actor_exists"; readonly actorId: ActorId }
  | { readonly kind: "resource_at_least"; readonly resourceType: ResourceType; readonly amount: number }
  | { readonly kind: "supply_at_least"; readonly amount: number }
  | { readonly kind: "capability_supported"; readonly capabilityId: string }
  | { readonly kind: "query_ready"; readonly queryId: AiQueryId }
  | { readonly kind: "target_visible"; readonly actorId: ActorId }
  | { readonly kind: "plan_active"; readonly planId: AiPlanId };

/** Claims make conflicts and capacity consumption explicit before dispatch. */
export type AiIntentClaim =
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

interface AiIntentBase {
  readonly intentId: AiIntentId;
  readonly effectId: AiEffectId;
  readonly planId: AiPlanId;
  readonly demandId: AiDemandId | null;
  readonly lane: AiServiceLane;
  readonly proposedTick: AiSimulationTick;
  readonly urgencyClass: number;
  readonly utility: number;
  /** Resource budget authority: survival bypasses posture quotas but still consumes the shared stockpile. */
  readonly spendingCategory?: "survival" | "economy" | "defense";
  readonly preconditions: readonly AiIntentPrecondition[];
  readonly claims: readonly AiIntentClaim[];
  readonly reasonCode: string;
}

/** Discriminated pure action proposal; the runtime adapter alone translates accepted intents to commands. */
export type AiIntent =
  | (AiIntentBase & {
      readonly kind: "assign_gatherers";
      readonly actorIds: readonly ActorId[];
      readonly resourceType: ResourceType;
      readonly sourceActorId: ActorId | null;
    })
  | (AiIntentBase & {
      readonly kind: "construct";
      readonly builderIds: readonly ActorId[];
      readonly objectName: ObjectNames;
      readonly logicalPosition: Vector3Simple;
      readonly siteKey: string;
    })
  | (AiIntentBase & {
      /** Reassigns displaced builders to an already observed unfinished site. */
      readonly kind: "resume_construct";
      readonly actorIds: readonly ActorId[];
      readonly targetActorId: ActorId;
    })
  | (AiIntentBase & { readonly kind: "produce"; readonly producerId: ActorId; readonly objectName: ObjectNames })
  | (AiIntentBase & { readonly kind: "research"; readonly producerId: ActorId; readonly researchType: ResearchType })
  | (AiIntentBase & {
      readonly kind: "move" | "scout";
      readonly actorIds: readonly ActorId[];
      readonly logicalPosition: Vector3Simple;
    })
  | (AiIntentBase & {
      readonly kind: "attack";
      readonly actorIds: readonly ActorId[];
      readonly targetActorId: ActorId | null;
      readonly targetPosition: Vector3Simple | null;
    })
  | (AiIntentBase & { readonly kind: "board"; readonly actorIds: readonly ActorId[]; readonly transportId: ActorId })
  | (AiIntentBase & {
      readonly kind: "unload";
      readonly transportId: ActorId;
      readonly passengerIds: readonly ActorId[];
      readonly logicalPosition: Vector3Simple;
    })
  | (AiIntentBase & {
      readonly kind: "heal" | "repair" | "tend";
      readonly actorIds: readonly ActorId[];
      readonly targetActorId: ActorId;
    })
  | (AiIntentBase & {
      readonly kind: "cast";
      readonly actorId: ActorId;
      readonly spellType: SpellType;
      readonly targetActorId: ActorId | null;
      readonly targetPosition: Vector3Simple | null;
    })
  | (AiIntentBase & { readonly kind: "stop"; readonly actorIds: readonly ActorId[] })
  | (AiIntentBase & { readonly kind: "cancel"; readonly actorId: ActorId; readonly queueIndex: number })
  | (AiIntentBase & { readonly kind: "concede"; readonly reason: string });

/** Stable reason for arbitration; accepted and rejected paths share the same envelope. */
export type AiIntentDecision =
  | { readonly outcome: "accepted"; readonly intent: AiIntent; readonly reason: "accepted" }
  | {
      readonly outcome: "rejected";
      readonly intent: AiIntent;
      readonly reason:
        | "invalid_numeric_input"
        | "precondition_failed"
        | "claim_conflict"
        | "resource_conflict"
        | "posture_budget"
        | "profile_limit";
      readonly detail: string;
    };
