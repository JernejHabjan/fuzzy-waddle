import type {
  CampaignId,
  CampaignMissionId,
  CampaignMissionProgressionSnapshot,
  CampaignParticipantProgressionSnapshot,
  MissionRunIntegrityState
} from "./campaign";

export const CAMPAIGN_MISSION_RUNTIME_SCHEMA_VERSION = 6 as const;
export const CAMPAIGN_LOCAL_PRESENTATION_EVENT_KINDS = ["dialogue.presented", "cinematic.cue"] as const;

/**
 * Defines the closed campaign mission runtime status value set. Keeping this union named preserves exhaustive
 * handling and prevents incompatible free-form values at its boundaries.
 */
export type CampaignMissionRuntimeStatus = "initializing" | "running" | "victory" | "defeat" | "failed";
/**
 * Defines the closed campaign mission objective status value set. Keeping this union named preserves
 * exhaustive handling and prevents incompatible free-form values at its boundaries.
 */
export type CampaignMissionObjectiveStatus = "hidden" | "active" | "completed" | "failed" | "impossible";
/**
 * Defines the closed campaign mission objective checklist status value set. Keeping this union named preserves
 * exhaustive handling and prevents incompatible free-form values at its boundaries.
 */
export type CampaignMissionObjectiveChecklistStatus = "pending" | "completed";
/**
 * Defines the closed campaign mission encounter status value set. Keeping this union named preserves
 * exhaustive handling and prevents incompatible free-form values at its boundaries.
 */
export type CampaignMissionEncounterStatus = "inactive" | "active" | "completed" | "failed";
/**
 * Defines the closed campaign mission timer status value set. Keeping this union named preserves exhaustive
 * handling and prevents incompatible free-form values at its boundaries.
 */
export type CampaignMissionTimerStatus = "running" | "paused" | "elapsed" | "cancelled";
/**
 * Defines the closed campaign mission dialogue presentation status value set. Keeping this union named
 * preserves exhaustive handling and prevents incompatible free-form values at its boundaries.
 */
export type CampaignMissionDialoguePresentationStatus = "presenting" | "acknowledged";
/**
 * Defines the closed campaign mission cinematic stage value set. Keeping this union named preserves exhaustive
 * handling and prevents incompatible free-form values at its boundaries.
 */
export type CampaignMissionCinematicStage = "prelude" | "presenting" | "finalizing" | "completed";
/**
 * Defines the campaign local presentation event kind alias used by this module. Keep values in this named
 * domain so linked APIs and storage boundaries do not drift into an unconstrained primitive.
 */
export type CampaignLocalPresentationEventKind = (typeof CAMPAIGN_LOCAL_PRESENTATION_EVENT_KINDS)[number];

/**
 * Defines the closed campaign mission runtime json value value set. Keeping this union named preserves
 * exhaustive handling and prevents incompatible free-form values at its boundaries.
 */
export type CampaignMissionRuntimeJsonValue =
  | string
  | number
  | boolean
  | null
  | readonly CampaignMissionRuntimeJsonValue[]
  | { readonly [key: string]: CampaignMissionRuntimeJsonValue };

/**
 * Defines the structured campaign mission runtime event contract for this module. Its declared surface makes
 * tick, kind, source id, sequence, payload explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignMissionRuntimeEvent {
  /**
   * temporal value for {@link CampaignMissionRuntimeEvent}. It anchors ordering, expiry, or presentation timing
   * and must use the time domain declared by the enclosing contract.
   */
  readonly tick: number;
  /**
   * discriminator for {@link CampaignMissionRuntimeEvent}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly kind: string;
  /**
   * stable source id used by {@link CampaignMissionRuntimeEvent} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly sourceId: string;
  /**
   * numeric sequence carried by {@link CampaignMissionRuntimeEvent}. Its units and valid range are defined by
   * {@link CampaignMissionRuntimeEvent} and must remain consistent across producers and consumers.
   */
  readonly sequence: number;
  /**
   * Optional typed payload associated with {@link CampaignMissionRuntimeEvent}. Preserve its declared contract
   * at serialization and adapter boundaries instead of weakening it to an unstructured record.
   */
  readonly payload?: CampaignMissionRuntimeJsonValue;
  /**
   * Optional numeric initiator player number carried by {@link CampaignMissionRuntimeEvent}. Its units and valid
   * range are defined by {@link CampaignMissionRuntimeEvent} and must remain consistent across producers and
   * consumers.
   */
  readonly initiatorPlayerNumber?: number;
  /**
   * Optional initiator faction value carried by {@link CampaignMissionRuntimeEvent}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly initiatorFaction?: "tivara" | "skaduwee";
}

/**
 * Defines the structured campaign mission event base contract for this module. Its declared surface makes
 * tick, kind, source id, sequence, payload explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
interface CampaignMissionEventBase<TKind extends string, TPayload extends CampaignMissionRuntimeJsonValue> {
  /**
   * temporal value for {@link CampaignMissionEventBase}. It anchors ordering, expiry, or presentation timing and
   * must use the time domain declared by the enclosing contract.
   */
  readonly tick: number;
  /**
   * discriminator for {@link CampaignMissionEventBase}. It selects the valid branch and behavior, so producers
   * and consumers must keep it synchronized with the accompanying fields.
   */
  readonly kind: TKind;
  /**
   * stable source id used by {@link CampaignMissionEventBase} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly sourceId: string;
  /**
   * numeric sequence carried by {@link CampaignMissionEventBase}. Its units and valid range are defined by
   * {@link CampaignMissionEventBase} and must remain consistent across producers and consumers.
   */
  readonly sequence: number;
  /**
   * typed payload associated with {@link CampaignMissionEventBase}. Preserve its declared contract at
   * serialization and adapter boundaries instead of weakening it to an unstructured record.
   */
  readonly payload: TPayload;
  /**
   * Optional numeric initiator player number carried by {@link CampaignMissionEventBase}. Its units and valid
   * range are defined by {@link CampaignMissionEventBase} and must remain consistent across producers and
   * consumers.
   */
  readonly initiatorPlayerNumber?: number;
  /**
   * Optional initiator faction value carried by {@link CampaignMissionEventBase}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly initiatorFaction?: "tivara" | "skaduwee";
}

/**
 * Defines the closed campaign mission event value set. Keeping this union named preserves exhaustive handling
 * and prevents incompatible free-form values at its boundaries.
 */
export type CampaignMissionEvent =
  | CampaignMissionEventBase<
      "actor.created",
      {
        readonly actorRuntimeId: string;
        readonly scenarioActorId?: string;
        readonly actorType: string;
        readonly owner?: number;
      }
    >
  | CampaignMissionEventBase<
      "actor.destroyed" | "actor.killed",
      { readonly actorRuntimeId: string; readonly scenarioActorId?: string; readonly actorType: string }
    >
  | CampaignMissionEventBase<
      "actor.owner-changed",
      {
        readonly actorRuntimeId: string;
        readonly scenarioActorId?: string;
        readonly previousOwner?: number;
        readonly owner?: number;
      }
    >
  | CampaignMissionEventBase<
      "actor.entered-region" | "actor.left-region",
      { readonly scenarioActorId: string; readonly regionId: string }
    >
  | CampaignMissionEventBase<
      "construction.completed",
      { readonly scenarioActorId?: string; readonly actorType: string; readonly owner?: number }
    >
  | CampaignMissionEventBase<"research.completed", { readonly playerNumber: number; readonly researchType: string }>
  | CampaignMissionEventBase<
      "resource.changed",
      { readonly playerNumber: number; readonly resourceType: string; readonly delta: number; readonly total: number }
    >
  | CampaignMissionEventBase<"timer.elapsed", { readonly timerId: string }>
  | CampaignMissionEventBase<
      "encounter.changed",
      { readonly encounterId: string; readonly state: CampaignMissionEncounterStatus }
    >
  | CampaignMissionEventBase<
      "encounter.wave-warning" | "encounter.wave-spawned",
      {
        readonly encounterId: string;
        readonly state: CampaignMissionEncounterStatus;
        readonly waveId: string;
        readonly detail: string | null;
      }
    >
  | CampaignMissionEventBase<
      "objective.changed",
      {
        readonly objectiveId: string;
        readonly state: CampaignMissionObjectiveStatus;
        readonly checklistId?: string;
        readonly checklistState?: CampaignMissionObjectiveChecklistStatus;
        readonly current?: number;
        readonly target?: number;
      }
    >
  | CampaignMissionEventBase<"dialogue.presented", { readonly lineId: string; readonly ownerToken: string }>
  | CampaignMissionEventBase<"dialogue.acknowledged", { readonly lineId: string; readonly ownerToken?: string }>
  | CampaignMissionEventBase<"cinematic.cue", { readonly cinematicId: string; readonly cueIndex: number }>
  | CampaignMissionEventBase<"cinematic.finished", { readonly cinematicId: string; readonly skipped: boolean }>;

/**
 * Defines the structured campaign mission timer runtime state contract for this module. Its declared surface
 * makes duration ticks, remaining ticks, status, started at tick explicit to every consumer. Use this shared
 * shape rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignMissionTimerRuntimeState {
  /**
   * numeric duration ticks carried by {@link CampaignMissionTimerRuntimeState}. Its units and valid range are
   * defined by {@link CampaignMissionTimerRuntimeState} and must remain consistent across producers and
   * consumers.
   */
  durationTicks: number;
  /**
   * numeric remaining ticks carried by {@link CampaignMissionTimerRuntimeState}. Its units and valid range are
   * defined by {@link CampaignMissionTimerRuntimeState} and must remain consistent across producers and
   * consumers.
   */
  remainingTicks: number;
  /**
   * discriminator for {@link CampaignMissionTimerRuntimeState}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  status: CampaignMissionTimerStatus;
  /**
   * Optional temporal value for {@link CampaignMissionTimerRuntimeState}. It anchors ordering, expiry, or
   * presentation timing and must use the time domain declared by the enclosing contract.
   */
  startedAtTick?: number;
}

/**
 * Defines the structured campaign mission objective runtime state contract for this module. Its declared
 * surface makes status, updated at tick, revealed at tick, completed at tick, failed at tick explicit to every
 * consumer. Use this shared shape rather than an ad-hoc object so adapters, persistence, and callers remain
 * compatible.
 */
export interface CampaignMissionObjectiveRuntimeState {
  /**
   * discriminator for {@link CampaignMissionObjectiveRuntimeState}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  status: CampaignMissionObjectiveStatus;
  /**
   * temporal value for {@link CampaignMissionObjectiveRuntimeState}. It anchors ordering, expiry, or
   * presentation timing and must use the time domain declared by the enclosing contract.
   */
  updatedAtTick: number;
  /**
   * Optional temporal value for {@link CampaignMissionObjectiveRuntimeState}. It anchors ordering, expiry, or
   * presentation timing and must use the time domain declared by the enclosing contract.
   */
  revealedAtTick?: number;
  /**
   * Optional temporal value for {@link CampaignMissionObjectiveRuntimeState}. It anchors ordering, expiry, or
   * presentation timing and must use the time domain declared by the enclosing contract.
   */
  completedAtTick?: number;
  /**
   * Optional temporal value for {@link CampaignMissionObjectiveRuntimeState}. It anchors ordering, expiry, or
   * presentation timing and must use the time domain declared by the enclosing contract.
   */
  failedAtTick?: number;
  /**
   * Optional temporal value for {@link CampaignMissionObjectiveRuntimeState}. It anchors ordering, expiry, or
   * presentation timing and must use the time domain declared by the enclosing contract.
   */
  impossibleAtTick?: number;
  /**
   * Optional stable reason id used by {@link CampaignMissionObjectiveRuntimeState} to correlate this value with
   * related records, events, or authored content; it is not a display label.
   */
  reasonId?: string;
  /**
   * early completed value carried by {@link CampaignMissionObjectiveRuntimeState}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  earlyCompleted: boolean;
  /**
   * keyed/nested checklist structure owned by {@link CampaignMissionObjectiveRuntimeState}. Keep its keys and
   * value contract explicit so callers cannot smuggle a broader shape across this boundary.
   */
  checklist: Record<string, CampaignMissionObjectiveChecklistRuntimeState>;
  /**
   * collection value on {@link CampaignMissionObjectiveRuntimeState}. Its element type defines the records that
   * may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  announcedStatuses: CampaignMissionObjectiveStatus[];
}

/**
 * Defines the structured campaign mission objective checklist runtime state contract for this module. Its
 * declared surface makes status, updated at tick, current, target explicit to every consumer. Use this shared
 * shape rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignMissionObjectiveChecklistRuntimeState {
  /**
   * discriminator for {@link CampaignMissionObjectiveChecklistRuntimeState}. It selects the valid branch and
   * behavior, so producers and consumers must keep it synchronized with the accompanying fields.
   */
  status: CampaignMissionObjectiveChecklistStatus;
  /**
   * temporal value for {@link CampaignMissionObjectiveChecklistRuntimeState}. It anchors ordering, expiry, or
   * presentation timing and must use the time domain declared by the enclosing contract.
   */
  updatedAtTick: number;
  /**
   * Optional numeric current carried by {@link CampaignMissionObjectiveChecklistRuntimeState}. Its units and
   * valid range are defined by {@link CampaignMissionObjectiveChecklistRuntimeState} and must remain consistent
   * across producers and consumers.
   */
  current?: number;
  /**
   * Optional numeric bound or quantity carried by {@link CampaignMissionObjectiveChecklistRuntimeState}.
   * Interpret it in the owning contract’s units and preserve its validation constraints at boundaries.
   */
  target?: number;
}

/**
 * Defines the structured campaign mission message history entry contract for this module. Its declared surface
 * makes sequence, tick, kind, source id, text id explicit to every consumer. Use this shared shape rather than
 * an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignMissionMessageHistoryEntry {
  /**
   * numeric sequence carried by {@link CampaignMissionMessageHistoryEntry}. Its units and valid range are
   * defined by {@link CampaignMissionMessageHistoryEntry} and must remain consistent across producers and
   * consumers.
   */
  sequence: number;
  /**
   * temporal value for {@link CampaignMissionMessageHistoryEntry}. It anchors ordering, expiry, or presentation
   * timing and must use the time domain declared by the enclosing contract.
   */
  tick: number;
  /**
   * discriminator for {@link CampaignMissionMessageHistoryEntry}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  kind: "objective" | "tutorial" | "warning";
  /**
   * stable source id used by {@link CampaignMissionMessageHistoryEntry} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  sourceId: string;
  /**
   * stable text id used by {@link CampaignMissionMessageHistoryEntry} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  textId: string;
  /**
   * Optional discriminator for {@link CampaignMissionMessageHistoryEntry}. It selects the valid branch and
   * behavior, so producers and consumers must keep it synchronized with the accompanying fields.
   */
  state?: CampaignMissionObjectiveStatus | CampaignMissionObjectiveChecklistStatus;
}

/**
 * Defines the structured campaign mission dialogue presentation runtime state contract for this module. Its
 * declared surface makes line id, owner token, status, started at tick, updated at tick explicit to every
 * consumer. Use this shared shape rather than an ad-hoc object so adapters, persistence, and callers remain
 * compatible.
 */
export interface CampaignMissionDialoguePresentationRuntimeState {
  /**
   * stable line id used by {@link CampaignMissionDialoguePresentationRuntimeState} to correlate this value with
   * related records, events, or authored content; it is not a display label.
   */
  lineId: string;
  /**
   * string owner token carried by {@link CampaignMissionDialoguePresentationRuntimeState}. Treat it according to
   * the owning contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  ownerToken: string;
  /**
   * discriminator for {@link CampaignMissionDialoguePresentationRuntimeState}. It selects the valid branch and
   * behavior, so producers and consumers must keep it synchronized with the accompanying fields.
   */
  status: CampaignMissionDialoguePresentationStatus;
  /**
   * temporal value for {@link CampaignMissionDialoguePresentationRuntimeState}. It anchors ordering, expiry, or
   * presentation timing and must use the time domain declared by the enclosing contract.
   */
  startedAtTick: number;
  /**
   * temporal value for {@link CampaignMissionDialoguePresentationRuntimeState}. It anchors ordering, expiry, or
   * presentation timing and must use the time domain declared by the enclosing contract.
   */
  updatedAtTick: number;
  /**
   * Optional temporal value for {@link CampaignMissionDialoguePresentationRuntimeState}. It anchors ordering,
   * expiry, or presentation timing and must use the time domain declared by the enclosing contract.
   */
  acknowledgedAtTick?: number;
}

/**
 * Defines the structured campaign mission dialogue history entry contract for this module. Its declared
 * surface makes sequence, tick, line id, owner token explicit to every consumer. Use this shared shape rather
 * than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignMissionDialogueHistoryEntry {
  /**
   * numeric sequence carried by {@link CampaignMissionDialogueHistoryEntry}. Its units and valid range are
   * defined by {@link CampaignMissionDialogueHistoryEntry} and must remain consistent across producers and
   * consumers.
   */
  sequence: number;
  /**
   * temporal value for {@link CampaignMissionDialogueHistoryEntry}. It anchors ordering, expiry, or presentation
   * timing and must use the time domain declared by the enclosing contract.
   */
  tick: number;
  /**
   * stable line id used by {@link CampaignMissionDialogueHistoryEntry} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  lineId: string;
  /**
   * string owner token carried by {@link CampaignMissionDialogueHistoryEntry}. Treat it according to the owning
   * contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  ownerToken: string;
}

/**
 * Defines the structured campaign mission cinematic runtime state contract for this module. Its declared
 * surface makes cinematic id, owner token, stage, started at tick, updated at tick explicit to every consumer.
 * Use this shared shape rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignMissionCinematicRuntimeState {
  /**
   * stable cinematic id used by {@link CampaignMissionCinematicRuntimeState} to correlate this value with
   * related records, events, or authored content; it is not a display label.
   */
  cinematicId: string;
  /**
   * string owner token carried by {@link CampaignMissionCinematicRuntimeState}. Treat it according to the owning
   * contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  ownerToken: string;
  /**
   * stage value carried by {@link CampaignMissionCinematicRuntimeState}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  stage: CampaignMissionCinematicStage;
  /**
   * temporal value for {@link CampaignMissionCinematicRuntimeState}. It anchors ordering, expiry, or
   * presentation timing and must use the time domain declared by the enclosing contract.
   */
  startedAtTick: number;
  /**
   * temporal value for {@link CampaignMissionCinematicRuntimeState}. It anchors ordering, expiry, or
   * presentation timing and must use the time domain declared by the enclosing contract.
   */
  updatedAtTick: number;
  /**
   * Optional temporal value for {@link CampaignMissionCinematicRuntimeState}. It anchors ordering, expiry, or
   * presentation timing and must use the time domain declared by the enclosing contract.
   */
  finishedAtTick?: number;
  /**
   * Optional numeric presentation cue index carried by {@link CampaignMissionCinematicRuntimeState}. Its units
   * and valid range are defined by {@link CampaignMissionCinematicRuntimeState} and must remain consistent
   * across producers and consumers.
   */
  presentationCueIndex?: number;
  /**
   * finalize requested value carried by {@link CampaignMissionCinematicRuntimeState}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  finalizeRequested: boolean;
  /**
   * finalized value carried by {@link CampaignMissionCinematicRuntimeState}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  finalized: boolean;
  /**
   * skipped value carried by {@link CampaignMissionCinematicRuntimeState}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  skipped: boolean;
}

/**
 * Defines the structured campaign mission trigger runtime state contract for this module. Its declared surface
 * makes fired count, last condition, last fired tick explicit to every consumer. Use this shared shape rather
 * than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignMissionTriggerRuntimeState {
  /**
   * numeric bound or quantity carried by {@link CampaignMissionTriggerRuntimeState}. Interpret it in the owning
   * contract’s units and preserve its validation constraints at boundaries.
   */
  firedCount: number;
  /**
   * last condition value carried by {@link CampaignMissionTriggerRuntimeState}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  lastCondition: boolean;
  /**
   * Optional temporal value for {@link CampaignMissionTriggerRuntimeState}. It anchors ordering, expiry, or
   * presentation timing and must use the time domain declared by the enclosing contract.
   */
  lastFiredTick?: number;
}

/**
 * Defines the structured campaign mission encounter runtime state contract for this module. Its declared
 * surface makes status, wave index, next eligible tick, living spawned actor ids, spawned actor owners
 * explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters, persistence, and
 * callers remain compatible.
 */
export interface CampaignMissionEncounterRuntimeState {
  /**
   * discriminator for {@link CampaignMissionEncounterRuntimeState}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  status: CampaignMissionEncounterStatus;
  /**
   * numeric wave index carried by {@link CampaignMissionEncounterRuntimeState}. Its units and valid range are
   * defined by {@link CampaignMissionEncounterRuntimeState} and must remain consistent across producers and
   * consumers.
   */
  waveIndex: number;
  /**
   * Optional temporal value for {@link CampaignMissionEncounterRuntimeState}. It anchors ordering, expiry, or
   * presentation timing and must use the time domain declared by the enclosing contract.
   */
  nextEligibleTick?: number;
  /**
   * collection owned by {@link CampaignMissionEncounterRuntimeState}. Preserve the declared element contract and
   * any ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  livingSpawnedActorIds: string[];
  /**
   * keyed/nested spawned actor owners structure owned by {@link CampaignMissionEncounterRuntimeState}. Keep its
   * keys and value contract explicit so callers cannot smuggle a broader shape across this boundary.
   */
  spawnedActorOwners: Record<string, number>;
  /**
   * numeric spawn cursor carried by {@link CampaignMissionEncounterRuntimeState}. Its units and valid range are
   * defined by {@link CampaignMissionEncounterRuntimeState} and must remain consistent across producers and
   * consumers.
   */
  spawnCursor: number;
  /**
   * collection owned by {@link CampaignMissionEncounterRuntimeState}. Preserve the declared element contract and
   * any ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  deterministicBranchIds: Record<string, string>;
  /**
   * collection owned by {@link CampaignMissionEncounterRuntimeState}. Preserve the declared element contract and
   * any ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  warnedWaveIds: string[];
  /**
   * numeric blocked attempts carried by {@link CampaignMissionEncounterRuntimeState}. Its units and valid range
   * are defined by {@link CampaignMissionEncounterRuntimeState} and must remain consistent across producers and
   * consumers.
   */
  blockedAttempts: number;
  /**
   * Optional string failure reason carried by {@link CampaignMissionEncounterRuntimeState}. Treat it according
   * to the owning contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  failureReason?: string;
}

/**
 * Defines the structured campaign mission difficulty runtime state contract for this module. Its declared
 * surface makes difficulty, player count, starting resource scale, wave size scale, warning ticks explicit to
 * every consumer. Use this shared shape rather than an ad-hoc object so adapters, persistence, and callers
 * remain compatible.
 */
export interface CampaignMissionDifficultyRuntimeState {
  /**
   * difficulty value carried by {@link CampaignMissionDifficultyRuntimeState}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  difficulty: "story" | "normal" | "hard";
  /**
   * numeric bound or quantity carried by {@link CampaignMissionDifficultyRuntimeState}. Interpret it in the
   * owning contract’s units and preserve its validation constraints at boundaries.
   */
  playerCount: number;
  /**
   * Optional numeric bound or quantity carried by {@link CampaignMissionDifficultyRuntimeState}. Interpret it in
   * the owning contract’s units and preserve its validation constraints at boundaries.
   */
  startingResourceScale?: number;
  /**
   * Optional numeric bound or quantity carried by {@link CampaignMissionDifficultyRuntimeState}. Interpret it in
   * the owning contract’s units and preserve its validation constraints at boundaries.
   */
  waveSizeScale?: number;
  /**
   * Optional numeric warning ticks carried by {@link CampaignMissionDifficultyRuntimeState}. Its units and valid
   * range are defined by {@link CampaignMissionDifficultyRuntimeState} and must remain consistent across
   * producers and consumers.
   */
  warningTicks?: number;
  /**
   * Optional numeric bound or quantity carried by {@link CampaignMissionDifficultyRuntimeState}. Interpret it in
   * the owning contract’s units and preserve its validation constraints at boundaries.
   */
  damageScale?: number;
  /**
   * Optional numeric bound or quantity carried by {@link CampaignMissionDifficultyRuntimeState}. Interpret it in
   * the owning contract’s units and preserve its validation constraints at boundaries.
   */
  aiAggressionScale?: number;
}

/**
 * Defines the structured campaign mission action continuation state contract for this module. Its declared
 * surface makes action id, kind, owner token, scope, started at tick explicit to every consumer. Use this
 * shared shape rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignMissionActionContinuationState {
  /**
   * stable action id used by {@link CampaignMissionActionContinuationState} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  actionId: string;
  /**
   * discriminator for {@link CampaignMissionActionContinuationState}. It selects the valid branch and behavior,
   * so producers and consumers must keep it synchronized with the accompanying fields.
   */
  kind: string;
  /**
   * string owner token carried by {@link CampaignMissionActionContinuationState}. Treat it according to the
   * owning contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  ownerToken: string;
  /**
   * discriminator for {@link CampaignMissionActionContinuationState}. It selects the valid branch and behavior,
   * so producers and consumers must keep it synchronized with the accompanying fields.
   */
  scope: "phase" | "mission";
  /**
   * temporal value for {@link CampaignMissionActionContinuationState}. It anchors ordering, expiry, or
   * presentation timing and must use the time domain declared by the enclosing contract.
   */
  startedAtTick: number;
  /**
   * temporal value for {@link CampaignMissionActionContinuationState}. It anchors ordering, expiry, or
   * presentation timing and must use the time domain declared by the enclosing contract.
   */
  updatedAtTick: number;
  /**
   * discriminator for {@link CampaignMissionActionContinuationState}. It selects the valid branch and behavior,
   * so producers and consumers must keep it synchronized with the accompanying fields.
   */
  state: CampaignMissionRuntimeJsonValue;
}

/**
 * Defines the structured campaign mission owned resource runtime state contract for this module. Its declared
 * surface makes resource id, kind, owner token, state explicit to every consumer. Use this shared shape rather
 * than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignMissionOwnedResourceRuntimeState {
  /**
   * stable resource id used by {@link CampaignMissionOwnedResourceRuntimeState} to correlate this value with
   * related records, events, or authored content; it is not a display label.
   */
  resourceId: string;
  /**
   * discriminator for {@link CampaignMissionOwnedResourceRuntimeState}. It selects the valid branch and
   * behavior, so producers and consumers must keep it synchronized with the accompanying fields.
   */
  kind: string;
  /**
   * string owner token carried by {@link CampaignMissionOwnedResourceRuntimeState}. Treat it according to the
   * owning contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  ownerToken: string;
  /**
   * Optional discriminator for {@link CampaignMissionOwnedResourceRuntimeState}. It selects the valid branch and
   * behavior, so producers and consumers must keep it synchronized with the accompanying fields.
   */
  state?: CampaignMissionRuntimeJsonValue;
}

/**
 * Defines the structured campaign mission runtime diagnostic contract for this module. Its declared surface
 * makes code, message, tick, source id, phase id explicit to every consumer. Use this shared shape rather than
 * an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignMissionRuntimeDiagnostic {
  /**
   * code value carried by {@link CampaignMissionRuntimeDiagnostic}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  code:
    | "action-budget-exceeded"
    | "transition-budget-exceeded"
    | "invalid-runtime-state"
    | "action-failed"
    | "missing-reference"
    | "unresumable-action"
    | "resource-leak";
  /**
   * string message carried by {@link CampaignMissionRuntimeDiagnostic}. Treat it according to the owning
   * contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  message: string;
  /**
   * temporal value for {@link CampaignMissionRuntimeDiagnostic}. It anchors ordering, expiry, or presentation
   * timing and must use the time domain declared by the enclosing contract.
   */
  tick: number;
  /**
   * Optional stable source id used by {@link CampaignMissionRuntimeDiagnostic} to correlate this value with
   * related records, events, or authored content; it is not a display label.
   */
  sourceId?: string;
  /**
   * Optional stable phase id used by {@link CampaignMissionRuntimeDiagnostic} to correlate this value with
   * related records, events, or authored content; it is not a display label.
   */
  phaseId?: string;
  /**
   * Optional stable trigger id used by {@link CampaignMissionRuntimeDiagnostic} to correlate this value with
   * related records, events, or authored content; it is not a display label.
   */
  triggerId?: string;
  /**
   * Optional stable action id used by {@link CampaignMissionRuntimeDiagnostic} to correlate this value with
   * related records, events, or authored content; it is not a display label.
   */
  actionId?: string;
}

/**
 * Defines the structured campaign mission runtime trace entry contract for this module. Its declared surface
 * makes tick, kind, source id, detail explicit to every consumer. Use this shared shape rather than an ad-hoc
 * object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignMissionRuntimeTraceEntry {
  /**
   * temporal value for {@link CampaignMissionRuntimeTraceEntry}. It anchors ordering, expiry, or presentation
   * timing and must use the time domain declared by the enclosing contract.
   */
  tick: number;
  /**
   * discriminator for {@link CampaignMissionRuntimeTraceEntry}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  kind:
    | "action"
    | "action-waiting"
    | "action-cancelled"
    | "phase-entered"
    | "phase-completed"
    | "objective-changed"
    | "encounter-changed"
    | "outcome-requested"
    | "diagnostic";
  /**
   * stable source id used by {@link CampaignMissionRuntimeTraceEntry} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  sourceId: string;
  /**
   * Optional detail value carried by {@link CampaignMissionRuntimeTraceEntry}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  detail?: CampaignMissionRuntimeJsonValue;
}

/**
 * Defines the structured campaign mission runtime integrity contract for this module. Its declared surface
 * makes last processed tick, last queued event sequence, processed action count, processed transition count,
 * last tick action count explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface CampaignMissionRuntimeIntegrity {
  /**
   * temporal value for {@link CampaignMissionRuntimeIntegrity}. It anchors ordering, expiry, or presentation
   * timing and must use the time domain declared by the enclosing contract.
   */
  lastProcessedTick: number;
  /**
   * numeric last queued event sequence carried by {@link CampaignMissionRuntimeIntegrity}. Its units and valid
   * range are defined by {@link CampaignMissionRuntimeIntegrity} and must remain consistent across producers and
   * consumers.
   */
  lastQueuedEventSequence: number;
  /**
   * numeric bound or quantity carried by {@link CampaignMissionRuntimeIntegrity}. Interpret it in the owning
   * contract’s units and preserve its validation constraints at boundaries.
   */
  processedActionCount: number;
  /**
   * numeric bound or quantity carried by {@link CampaignMissionRuntimeIntegrity}. Interpret it in the owning
   * contract’s units and preserve its validation constraints at boundaries.
   */
  processedTransitionCount: number;
  /**
   * numeric bound or quantity carried by {@link CampaignMissionRuntimeIntegrity}. Interpret it in the owning
   * contract’s units and preserve its validation constraints at boundaries.
   */
  lastTickActionCount: number;
  /**
   * numeric bound or quantity carried by {@link CampaignMissionRuntimeIntegrity}. Interpret it in the owning
   * contract’s units and preserve its validation constraints at boundaries.
   */
  lastTickTransitionCount: number;
  /**
   * outcome dispatched value carried by {@link CampaignMissionRuntimeIntegrity}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  outcomeDispatched: boolean;
  /**
   * collection value on {@link CampaignMissionRuntimeIntegrity}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  recentTrace: CampaignMissionRuntimeTraceEntry[];
  /**
   * Optional diagnostic value carried by {@link CampaignMissionRuntimeIntegrity}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  diagnostic?: CampaignMissionRuntimeDiagnostic;
}

/**
 * Defines the structured campaign restore invariant report contract for this module. Its declared surface
 * makes status, checked at tick, issues, recovery options explicit to every consumer. Use this shared shape
 * rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignRestoreInvariantReport {
  /**
   * discriminator for {@link CampaignRestoreInvariantReport}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly status: "valid" | "invalid";
  /**
   * temporal value for {@link CampaignRestoreInvariantReport}. It anchors ordering, expiry, or presentation
   * timing and must use the time domain declared by the enclosing contract.
   */
  readonly checkedAtTick: number;
  /**
   * boolean policy/value on {@link CampaignRestoreInvariantReport} that explicitly controls whether the
   * associated behavior is active; do not infer it from unrelated state.
   */
  readonly issues: readonly string[];
  /**
   * collection value on {@link CampaignRestoreInvariantReport}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly recoveryOptions: readonly ("earlier-autosave" | "restart-mission" | "export" | "delete")[];
}

/** Defines the campaign mission runtime state contract used by this module; its declared members form the compatible boundary for linked consumers. */
export interface CampaignMissionRuntimeState {
  /**
   * compatibility schema version for {@link CampaignMissionRuntimeState}. Consumers use it to choose validation,
   * migration, or conflict-handling rules instead of guessing the payload shape.
   */
  schemaVersion: typeof CAMPAIGN_MISSION_RUNTIME_SCHEMA_VERSION;
  /**
   * stable campaign id used by {@link CampaignMissionRuntimeState} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  campaignId: CampaignId;
  /**
   * stable mission id used by {@link CampaignMissionRuntimeState} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  missionId: CampaignMissionId;
  /**
   * compatibility mission revision for {@link CampaignMissionRuntimeState}. Consumers use it to choose
   * validation, migration, or conflict-handling rules instead of guessing the payload shape.
   */
  missionRevision: number;
  /**
   * discriminator for {@link CampaignMissionRuntimeState}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  status: CampaignMissionRuntimeStatus;
  /**
   * initialized value carried by {@link CampaignMissionRuntimeState}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  initialized: boolean;
  /**
   * difficulty value carried by {@link CampaignMissionRuntimeState}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  difficulty: CampaignMissionDifficultyRuntimeState;
  /**
   * collection owned by {@link CampaignMissionRuntimeState}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  activePhaseIds: string[];
  /**
   * collection owned by {@link CampaignMissionRuntimeState}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  completedPhaseIds: string[];
  /**
   * collection owned by {@link CampaignMissionRuntimeState}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  pendingPhaseIds: string[];
  /**
   * keyed/nested facts structure owned by {@link CampaignMissionRuntimeState}. Keep its keys and value contract
   * explicit so callers cannot smuggle a broader shape across this boundary.
   */
  facts: Record<string, boolean | string>;
  /**
   * keyed/nested counters structure owned by {@link CampaignMissionRuntimeState}. Keep its keys and value
   * contract explicit so callers cannot smuggle a broader shape across this boundary.
   */
  counters: Record<string, number>;
  /** Documents the mission items member and its declared contract at this boundary. */
  missionItems?: Record<string, number>;
  /**
   * keyed/nested timers structure owned by {@link CampaignMissionRuntimeState}. Keep its keys and value contract
   * explicit so callers cannot smuggle a broader shape across this boundary.
   */
  timers: Record<string, CampaignMissionTimerRuntimeState>;
  /**
   * collection owned by {@link CampaignMissionRuntimeState}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  objectives: Record<string, CampaignMissionObjectiveRuntimeState>;
  /**
   * collection value on {@link CampaignMissionRuntimeState}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  missionMessageHistory: CampaignMissionMessageHistoryEntry[];
  /**
   * keyed/nested dialogue presentations structure owned by {@link CampaignMissionRuntimeState}. Keep its keys
   * and value contract explicit so callers cannot smuggle a broader shape across this boundary.
   */
  dialoguePresentations: Record<string, CampaignMissionDialoguePresentationRuntimeState>;
  /**
   * collection value on {@link CampaignMissionRuntimeState}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  dialogueHistory: CampaignMissionDialogueHistoryEntry[];
  /**
   * keyed/nested cinematics structure owned by {@link CampaignMissionRuntimeState}. Keep its keys and value
   * contract explicit so callers cannot smuggle a broader shape across this boundary.
   */
  cinematics: Record<string, CampaignMissionCinematicRuntimeState>;
  /**
   * Optional stable active cinematic id used by {@link CampaignMissionRuntimeState} to correlate this value with
   * related records, events, or authored content; it is not a display label.
   */
  activeCinematicId?: string;
  /** Documents the active control player number member and its declared contract at this boundary. */
  activeControlPlayerNumber?: number;
  /**
   * keyed/nested participant teams structure owned by {@link CampaignMissionRuntimeState}. Keep its keys and
   * value contract explicit so callers cannot smuggle a broader shape across this boundary.
   */
  participantTeams: Record<string, number>;
  /**
   * keyed/nested encounters structure owned by {@link CampaignMissionRuntimeState}. Keep its keys and value
   * contract explicit so callers cannot smuggle a broader shape across this boundary.
   */
  encounters: Record<string, CampaignMissionEncounterRuntimeState>;
  /**
   * collection owned by {@link CampaignMissionRuntimeState}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  claimedTriggerIds: string[];
  /** Documents the claimed checkpoint ids member and its declared contract at this boundary. */
  claimedCheckpointIds?: string[];
  /**
   * Optional collection owned by {@link CampaignMissionRuntimeState}. Preserve the declared element contract and
   * any ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  pendingCheckpointIds?: string[];
  /**
   * Optional stable last checkpoint id used by {@link CampaignMissionRuntimeState} to correlate this value with
   * related records, events, or authored content; it is not a display label.
   */
  lastCheckpointId?: string;
  /**
   * keyed/nested trigger states structure owned by {@link CampaignMissionRuntimeState}. Keep its keys and value
   * contract explicit so callers cannot smuggle a broader shape across this boundary.
   */
  triggerStates: Record<string, CampaignMissionTriggerRuntimeState>;
  /**
   * collection owned by {@link CampaignMissionRuntimeState}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  claimedRewardIds: string[];
  /** Documents the progression member and its declared contract at this boundary. */
  progression?: CampaignMissionProgressionSnapshot;
  /** Documents the participant progression snapshots member and its declared contract at this boundary. */
  participantProgressionSnapshots?: CampaignParticipantProgressionSnapshot[];
  /** Documents the reward integrity member and its declared contract at this boundary. */
  rewardIntegrity?: MissionRunIntegrityState;
  /**
   * collection owned by {@link CampaignMissionRuntimeState}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  pendingEvents: CampaignMissionRuntimeEvent[];
  /**
   * keyed/nested action continuations structure owned by {@link CampaignMissionRuntimeState}. Keep its keys and
   * value contract explicit so callers cannot smuggle a broader shape across this boundary.
   */
  actionContinuations: Record<string, CampaignMissionActionContinuationState>;
  /**
   * keyed/nested owned resources structure owned by {@link CampaignMissionRuntimeState}. Keep its keys and value
   * contract explicit so callers cannot smuggle a broader shape across this boundary.
   */
  ownedResources: Record<string, CampaignMissionOwnedResourceRuntimeState>;
  /**
   * integrity value carried by {@link CampaignMissionRuntimeState}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  integrity: CampaignMissionRuntimeIntegrity;
}
