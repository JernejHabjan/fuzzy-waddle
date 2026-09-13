import { FactionType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiReproBundleV1 } from "../contracts/ai-repro-bundle-v1";

/** Access context for importing a reproduction bundle. */
export interface AiReproBundleParseOptions {
  readonly access: "player" | "host" | "developer";
  readonly maxBytes?: number;
}

/** Stable validation failure surfaced by CLI and debug UI without rendering payload markup. */
export class AiReproBundleValidationError extends Error {
  constructor(
    readonly code:
      | "oversized"
      | "malformed_json"
      | "malformed_bundle"
      | "unsupported_version"
      | "unsafe_reference"
      | "unsafe_label"
      | "access_denied"
  ) {
    super(code);
    this.name = "AiReproBundleValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeReference(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 512 &&
    !value.startsWith("/") &&
    !value.includes("..") &&
    !value.includes("\\") &&
    !value.includes(":")
  );
}

function hasMarkup(value: unknown): boolean {
  if (typeof value === "string") return /<\/?[a-z]|on[a-z]+\s*=|javascript:/i.test(value);
  if (Array.isArray(value)) return value.some(hasMarkup);
  return isRecord(value) && Object.values(value).some(hasMarkup);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 512;
}

function isAiReproBundleV1(value: unknown): value is AiReproBundleV1 {
  if (!isRecord(value)) return false;
  const replay = value.replayInputs;
  const display = value.display;
  if (!isRecord(replay) || !isRecord(display)) return false;
  const strings = [
    replay.sourceRevision,
    replay.mapId,
    replay.mapDigest,
    replay.contentDigest,
    replay.configVersion,
    replay.profileVersion,
    replay.archetypeVersion,
    replay.rulesVersion,
    replay.snapshotDigest,
    replay.inputDigest,
    display.label
  ];
  const completeness = value.completeness;
  return (
    value.schemaVersion === 1 &&
    (value.kind === "decision" || value.kind === "runtime") &&
    strings.every(isNonEmptyString) &&
    (replay.dirtySourceDigest === null || typeof replay.dirtySourceDigest === "string") &&
    (replay.scenarioId === null || typeof replay.scenarioId === "string") &&
    (replay.difficulty === "easy" || replay.difficulty === "normal" || replay.difficulty === "hard") &&
    (replay.faction === FactionType.Tivara || replay.faction === FactionType.Skaduwee) &&
    isNonNegativeInteger(replay.playerNumber) &&
    isNonNegativeInteger(replay.tickInterval) &&
    replay.tickInterval > 0 &&
    isNonNegativeInteger(replay.authorityEpoch) &&
    isNonNegativeInteger(replay.tick) &&
    (value.privacy === "permitted_player_data" || value.privacy === "host_confidential") &&
    Array.isArray(replay.expectedCheckpoints) &&
    replay.expectedCheckpoints.every(
      (checkpoint) =>
        isRecord(checkpoint) && isNonNegativeInteger(checkpoint.tick) && isNonEmptyString(checkpoint.digest)
    ) &&
    isRecord(completeness) &&
    (completeness.observation === "complete" ||
      completeness.observation === "truncated" ||
      completeness.observation === "missing") &&
    (completeness.priorState === "complete" ||
      completeness.priorState === "truncated" ||
      completeness.priorState === "missing") &&
    (completeness.outcomes === "complete" ||
      completeness.outcomes === "truncated" ||
      completeness.outcomes === "missing") &&
    (completeness.alternatives === "complete" ||
      completeness.alternatives === "truncated" ||
      completeness.alternatives === "not_recorded") &&
    Array.isArray(completeness.missingRanges) &&
    completeness.missingRanges.every(
      (range) =>
        isRecord(range) &&
        isNonNegativeInteger(range.fromTick) &&
        isNonNegativeInteger(range.toTick) &&
        range.fromTick <= range.toTick
    ) &&
    isNonNegativeInteger(completeness.truncatedEventCount)
  );
}

/** Parses untrusted JSON with size, schema, traversal, markup and privacy guards. */
export function parseAiReproBundleV1(json: string, options: AiReproBundleParseOptions): AiReproBundleV1 {
  const maxBytes = options.maxBytes ?? 16 * 1024 * 1024;
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new AiReproBundleValidationError("malformed_bundle");
  }
  if (new TextEncoder().encode(json).byteLength > maxBytes) {
    throw new AiReproBundleValidationError("oversized");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new AiReproBundleValidationError("malformed_json");
  }
  if (!isRecord(parsed)) throw new AiReproBundleValidationError("malformed_bundle");
  if (parsed.schemaVersion !== 1) throw new AiReproBundleValidationError("unsupported_version");
  if (parsed.kind !== "decision" && parsed.kind !== "runtime") {
    throw new AiReproBundleValidationError("malformed_bundle");
  }
  const replay = parsed.replayInputs;
  if (!isRecord(replay)) throw new AiReproBundleValidationError("malformed_bundle");
  if (!isSafeReference(replay.snapshotReference) || !isSafeReference(replay.inputReference)) {
    throw new AiReproBundleValidationError("unsafe_reference");
  }
  if (hasMarkup(parsed)) throw new AiReproBundleValidationError("unsafe_label");
  if (parsed.kind === "runtime" && parsed.privacy !== "host_confidential") {
    throw new AiReproBundleValidationError("malformed_bundle");
  }
  if (parsed.privacy === "host_confidential" && options.access === "player") {
    throw new AiReproBundleValidationError("access_denied");
  }

  if (!isAiReproBundleV1(parsed)) throw new AiReproBundleValidationError("malformed_bundle");
  return parsed;
}
