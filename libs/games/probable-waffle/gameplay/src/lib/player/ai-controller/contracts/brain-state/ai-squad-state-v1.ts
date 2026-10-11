import type { ActorId, PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type { AiBaseId, AiDeadlineV1, AiSimulationTick, AiSquadId } from "../ai-core-types";

/** Squad membership and objective ownership. */
export interface AiSquadStateV1 {
  readonly squadId: AiSquadId;
  /** Persistent duty; one nearby contact does not reassign the whole army. */
  readonly role: "defense" | "attack" | "reserve" | "reinforcement" | "scout" | "escort";
  readonly domain: "ground" | "water" | "air" | "mixed";
  readonly actorIds: readonly ActorId[];
  readonly objectiveId: string | null;
  readonly state:
    | "forming"
    | "assemble"
    | "rally"
    | "ready"
    | "advance"
    | "moving"
    | "engage"
    | "engaged"
    | "defend"
    | "regroup"
    | "retreat"
    | "retreating"
    | "recover"
    | "recovering"
    | "reserve"
    | "searching"
    | "completed"
    | "cancelled";
  /** Mission-owned deadline and last independently observed useful effect. */
  readonly lifecycle?: Readonly<{
    readonly targetPlayerNumber: PlayerNumber | null;
    readonly targetRegionId: string | null;
    readonly protectedBaseId: AiBaseId | null;
    readonly rallyNodeId: string | null;
    readonly retreatNodeId: string | null;
    readonly createdTick: AiSimulationTick;
    readonly assemblyDeadline: AiDeadlineV1;
    readonly effectDeadline: AiDeadlineV1;
    readonly lastUsefulEffectTick: AiSimulationTick | null;
    readonly recoveryAttempt: number;
    readonly terminalReason: string | null;
  }>;
  /** Tactical commitment; saved fields prevent target thrash and retreat/relaunch loops. */
  readonly tactics?: Readonly<{
    readonly taskForceId: string;
    readonly script:
      | "hold_front"
      | "advance_focus"
      | "ranged_distance"
      | "spread_against_area"
      | "protected_retreat"
      | "intercept_air_transport"
      | "naval_control"
      | "escort"
      | "land_regroup"
      | "rampart_defend"
      | "rampart_reinforce"
      | "rampart_withdraw";
    readonly targetActorId: ActorId | null;
    readonly targetScore: number;
    readonly engagementRatioPermille: number;
    readonly confidencePermille: number;
    readonly predictedFriendlyLossPermille: number;
    readonly predictedEnemyLossPermille: number;
    readonly lastObservedMemberCount: number;
    readonly observedLossCount: number;
    readonly lastTransitionTick: AiSimulationTick;
    readonly nextReconsiderTick: AiSimulationTick;
    readonly oscillationCount: number;
    readonly orderSignature: string | null;
    /** Actors already covered by the current order signature; large squads continue across quota-limited steps. */
    readonly orderedActorIds: readonly ActorId[];
    readonly assignedPositions: readonly {
      readonly actorId: ActorId;
      readonly position: { readonly x: number; readonly y: number; readonly z: number };
    }[];
    readonly damageReservations: readonly {
      readonly actorId: ActorId;
      readonly targetActorId: ActorId;
      readonly expectedDamage: number;
      readonly impactTick: AiSimulationTick;
      readonly effectId?: string;
    }[];
    readonly protectedRouteNodeIds: readonly string[];
    readonly mobileReserveActorIds: readonly ActorId[];
    readonly objectiveAlternatives: readonly {
      readonly objectiveId: string;
      readonly score: number;
      readonly reason: string;
    }[];
  }>;
}
