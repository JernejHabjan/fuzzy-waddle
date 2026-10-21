import type { EncodedGameSaveRecord } from "@fuzzy-waddle/probable-waffle-protocol";
import type { captureNativeContinuationBoundary } from "./skirmish-ai-native-continuation-boundary";
import type { closeNativeDecisionTrace } from "./skirmish-ai-native-decision-trace";
import { digestCanonicalAiValue } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/canonical-ai-serialization";

type Boundary = Awaited<ReturnType<typeof captureNativeContinuationBoundary>>;
export interface NativeReplayCapsule {
  readonly schemaVersion: 1;
  readonly sourceRevision: string;
  readonly fixtureDigest: string;
  readonly mapId: string;
  readonly checkpoint: EncodedGameSaveRecord;
  readonly saved: Boundary;
  readonly control: Boundary;
  readonly trace: Awaited<ReturnType<typeof closeNativeDecisionTrace>>;
  readonly inputs: { readonly fromTick: number; readonly throughTick: number; readonly frameMilliseconds: 50;
    readonly simulationTimeScale: 1; readonly externalCommandCount: number };
  readonly payloadDigest: string;
}

/** JSON wire normalization follows the native codec; encrypted payloads remain opaque and are never decoded by this gate. */
export function nativeReplayCapsuleDigest(capsule: Omit<NativeReplayCapsule, "payloadDigest"> | NativeReplayCapsule) {
  const { payloadDigest: _digest, ...body } = capsule as NativeReplayCapsule;
  return digestCanonicalAiValue(JSON.parse(JSON.stringify(body)));
}

export function nativeReplayCapsuleBlocker(
  capsule: NativeReplayCapsule, sourceRevision: string, fixtureDigest: string
): string | null {
  if (!/^[a-f0-9]{40}$/.test(sourceRevision) || capsule.sourceRevision !== sourceRevision ||
      !fixtureDigest || capsule.fixtureDigest !== fixtureDigest || capsule.mapId !== "AI Open Economy (test only)")
    return "source_map_config_mismatch";
  const start = capsule.saved.owner.tick, end = capsule.control.owner.tick;
  if (capsule.schemaVersion !== 1 || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) ||
      start < 1 || end <= start || end > 4000 || capsule.inputs.fromTick !== start || capsule.inputs.throughTick !== end)
    return "missing_input_ranges";
  if (capsule.inputs.frameMilliseconds !== 50 || capsule.inputs.simulationTimeScale !== 1 ||
      capsule.inputs.externalCommandCount !== 0) return "unsupported_external_inputs";
  if (!capsule.checkpoint.id || capsule.checkpoint.revision < 1 || capsule.trace.overflow ||
      capsule.trace.records.length < 1 || capsule.trace.records.length > 2048 ||
      capsule.trace.records.some((entry) => entry.tick <= start || entry.tick > end)) return "incomplete_native_capture";
  const originalSequence = capsule.saved.owner.decisionSequence;
  if (originalSequence === null || capsule.trace.records.some((entry, index) => entry.sequence !== originalSequence + index + 1 ||
      index > 0 && entry.tick <= capsule.trace.records[index - 1].tick) ||
      capsule.trace.records.at(-1)?.sequence !== capsule.control.owner.decisionSequence) return "missing_input_ranges";
  if (capsule.saved.owner.matchId !== capsule.control.owner.matchId || capsule.saved.owner.seed !== capsule.control.owner.seed ||
      capsule.saved.profileVersion !== capsule.control.profileVersion ||
      capsule.saved.profileDifficulty !== capsule.control.profileDifficulty) return "source_map_config_mismatch";
  if (new TextEncoder().encode(JSON.stringify(capsule.checkpoint)).byteLength > 16 * 1024 * 1024)
    return "native_checkpoint_byte_limit";
  return nativeReplayCapsuleDigest(capsule) === capsule.payloadDigest ? null : "native_capsule_digest_mismatch";
}
