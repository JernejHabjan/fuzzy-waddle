import {
  ProbableWaffleGameCommandTypes,
  type GameCommand,
  type GameCommandExecution,
  type GameCommandOutcome,
  GameCommandOutcomeKinds
} from "./game-instance/probable-waffle/game-command";
import type { ProbableWaffleStartLevelDto } from "./probable-waffle/probable-waffle-api";

interface RawPayload {
  [key: string]: unknown;
}

const isPayload = (value: unknown): value is RawPayload =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isProbableWaffleStartLevelDto = (value: unknown): value is ProbableWaffleStartLevelDto =>
  isPayload(value) && typeof value.gameInstanceId === "string" && value.gameInstanceId.length > 0;

export const isProbableWaffleGameCommand = (value: unknown): value is GameCommand => {
  if (!isPayload(value)) return false;
  if (!Object.values(ProbableWaffleGameCommandTypes).includes(value.type as never)) return false;
  if (!Number.isInteger(value.tick) || !Number.isInteger(value.playerNumber)) return false;
  if (!isStringArray(value.actorIds)) return false;
  if (value.execution !== undefined && !isGameCommandExecution(value.execution)) return false;

  switch (value.type) {
    case ProbableWaffleGameCommandTypes.Move:
      return isVector3(value.tileVec3) && isVector3(value.worldVec3) && typeof value.queue === "boolean";
    case ProbableWaffleGameCommandTypes.ActorAction:
      return (
        typeof value.queue === "boolean" &&
        (value.tileVec3 === undefined || isVector3(value.tileVec3)) &&
        (value.targetObjectIds === undefined || isStringArray(value.targetObjectIds))
      );
    case ProbableWaffleGameCommandTypes.Stop:
    case ProbableWaffleGameCommandTypes.CancelResearch:
      return true;
    case ProbableWaffleGameCommandTypes.Production:
      return typeof value.actorName === "string";
    case ProbableWaffleGameCommandTypes.CancelProduction:
      return Number.isInteger(value.queueIndex) && (value.queueIndex as number) >= 0;
    case ProbableWaffleGameCommandTypes.Research:
      return typeof value.researchType === "string";
    case ProbableWaffleGameCommandTypes.Construct:
      return typeof value.actorName === "string" && isVector3(value.tileVec3) && isSafeId(value.siteKey);
    case ProbableWaffleGameCommandTypes.CastSpell:
      return (
        isSafeId(value.spellType) &&
        isVector3(value.tileVec3) &&
        (value.targetObjectId === undefined || isSafeId(value.targetObjectId))
      );
    case ProbableWaffleGameCommandTypes.Unload:
      return (
        (value.passengerIds === undefined || isStringArray(value.passengerIds)) &&
        (value.tileVec3 === undefined || isVector3(value.tileVec3))
      );
    case ProbableWaffleGameCommandTypes.SetRallyPoint:
      return (
        isVector3(value.tileVec3) &&
        isVector3(value.worldVec3) &&
        (value.targetObjectId === undefined || isSafeId(value.targetObjectId))
      );
    case ProbableWaffleGameCommandTypes.Concede:
      return typeof value.reason === "string" && value.reason.length > 0 && value.reason.length <= 160;
  }
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => isSafeId(entry));

const isSafeId = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= 256 && /^[a-zA-Z0-9_.:@/-]+$/.test(value);

const isVector3 = (value: unknown): boolean =>
  isPayload(value) && [value.x, value.y, value.z].every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate));

const isGameCommandExecution = (value: unknown): value is GameCommandExecution =>
  isPayload(value) &&
  value.schemaVersion === 1 &&
  isSafeId(value.commandId) &&
  isSafeId(value.commitmentKey) &&
  ["human", "ai", "campaign", "replay"].includes(String(value.source)) &&
  Number.isSafeInteger(value.authorityEpoch) &&
  (value.authorityEpoch as number) >= 0 &&
  Number.isSafeInteger(value.sequence) &&
  (value.sequence as number) >= 0 &&
  (value.intentId === undefined || isSafeId(value.intentId)) &&
  (value.effectId === undefined || isSafeId(value.effectId));

const gameCommandOutcomeReasons = new Set([
  "accepted_for_dispatch",
  "applied",
  "duplicate_command",
  "stale_authority_epoch",
  "invalid_command_metadata",
  "invalid_owner",
  "missing_actor",
  "inactive_actor",
  "invalid_target",
  "hidden_target",
  "illegal_site",
  "insufficient_resources",
  "capacity_full",
  "cooldown_active",
  "unsupported_action",
  "application_failed",
  "lost_outcome",
  "outcome_backlog_overflow",
  "cancelled"
]);

export const isProbableWaffleGameCommandOutcome = (value: unknown): value is GameCommandOutcome =>
  isPayload(value) &&
  value.schemaVersion === 1 &&
  Object.values(GameCommandOutcomeKinds).includes(value.kind as never) &&
  gameCommandOutcomeReasons.has(String(value.reason)) &&
  Number.isSafeInteger(value.tick) &&
  (value.tick as number) >= 0 &&
  Number.isSafeInteger(value.playerNumber) &&
  isSafeId(value.commandId) &&
  isSafeId(value.commitmentKey) &&
  Number.isSafeInteger(value.authorityEpoch) &&
  (value.authorityEpoch as number) >= 0 &&
  Number.isSafeInteger(value.sequence) &&
  (value.sequence as number) >= 0 &&
  (value.intentId === undefined || isSafeId(value.intentId)) &&
  (value.effectId === undefined || isSafeId(value.effectId)) &&
  isStringArray(value.actorIds) &&
  isStringArray(value.worldLinkIds) &&
  (value.detail === undefined || (typeof value.detail === "string" && value.detail.length <= 512));

export const isProbableWaffleSavePayload = (value: unknown): value is RawPayload =>
  isPayload(value) && typeof value.version === "number" && isPayload(value.game);

export const isProbableWaffleReplayPayload = (value: unknown): value is RawPayload =>
  isPayload(value) &&
  typeof value.version === "number" &&
  Array.isArray(value.commands) &&
  (value.commandOutcomes === undefined ||
    (Array.isArray(value.commandOutcomes) && value.commandOutcomes.every(isProbableWaffleGameCommandOutcome)));
