import { ProbableWaffleGameCommandTypes, type GameCommand } from "./game-instance/probable-waffle/game-command";
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
  return Array.isArray(value.actorIds) && value.actorIds.every((actorId) => typeof actorId === "string");
};

export const isProbableWaffleSavePayload = (value: unknown): value is RawPayload =>
  isPayload(value) && typeof value.version === "number" && isPayload(value.game);

export const isProbableWaffleReplayPayload = (value: unknown): value is RawPayload =>
  isPayload(value) && typeof value.version === "number" && Array.isArray(value.commands);
