import type { Browser, BrowserContext } from "@playwright/test";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";
import type { RuntimeRequestV1 } from "./skirmish-ai-runtime-request";
import type { NativeReplayCapsule } from "./skirmish-ai-native-replay-capsule";
import { nativeReplayCapsuleBlocker, nativeReplayCapsuleDigest } from "./skirmish-ai-native-replay-capsule";
import { runVariant } from "./skirmish-ai-runtime-variant-runner";
import { saveNativeMatch } from "./skirmish-ai-native-save-reload";
import { readNativeReplayRecord } from "./skirmish-ai-native-replay-record";
import { openNativeReplaySession } from "./skirmish-ai-native-replay-session";
import { captureNativeContinuationBoundary } from "./skirmish-ai-native-continuation-boundary";
import { armNativeDecisionTrace, closeNativeDecisionTrace } from "./skirmish-ai-native-decision-trace";
import { armNativeReplayInputWitness, closeNativeReplayInputWitness } from "./skirmish-ai-native-replay-input-witness";
import { armNativeDebugComparison, captureNativeDebugComparison, nativeDebugWorldDigest } from
  "./skirmish-ai-native-debug-comparison";
import { advanceRuntimeFrames } from "./skirmish-ai-runtime-frame-driver";
import { stepNativeReplay } from "./skirmish-ai-native-replay-step";
import { exerciseNativeLiveWorkbench } from "./skirmish-ai-native-live-workbench";
import { digestCanonicalAiValue } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/canonical-ai-serialization";

export type NativeReproProof = Awaited<ReturnType<typeof reproduceNativeCapsule>> & {
  readonly branch: string;
  readonly sourceRevision: string;
  readonly fixtureDigest: string;
  readonly rejectedCopy: string | null;
  readonly mismatchBlockers: readonly (string | null)[];
  readonly pure: Awaited<ReturnType<typeof captureNativeDebugComparison>>;
  readonly originalBeforeReplay: string;
  readonly originalAfterReplay: string;
};

/** Native incident, opaque codec checkpoint and a witnessed autonomous interval feed separate pure and physical replays. */
export async function runNativeReproVariant(
  browser: Browser, fixture: RuntimeFixtureV1, variant: RuntimeVariantV1, request: RuntimeRequestV1, branch: string
) {
  const world = variant.presetWorld;
  if (!world || world.events?.length || world.controls?.length || world.routeOutages?.length ||
      world.receiptFault || world.brainFault || variant.perturbations?.length)
    throw new Error("native_repro_has_unrecorded_external_inputs");
  let saved: NativeReplayCapsule["saved"] | undefined, checkpoint: NativeReplayCapsule["checkpoint"] | undefined;
  let nativeRepro: NativeReproProof | undefined;
  const result = await runVariant(browser, fixture, variant, request.seed, request.scenarioIds,
    request.sourceRevision, request.fixtureDigest, async (page, index, snapshot) => {
      if (index < 0 || snapshot?.tick !== 599) return;
      saved = await captureNativeContinuationBoundary(page, 2);
      if (saved.recoveryCount < 1 || saved.retryDebt < 1 || saved.oldestFailureTick === null || saved.oldestFailureTick >= 599)
        throw new Error("native_repro_actual_aged_incident_missing");
      const save = await saveNativeMatch(page, 2);
      checkpoint = await readNativeReplayRecord(page, save.saveId);
      await armNativeDecisionTrace(page, 2); await armNativeDebugComparison(page);
      await armNativeReplayInputWitness(page);
    }, async (page) => {
      if (!saved || !checkpoint) throw new Error("native_repro_actual_checkpoint_missing");
      const control = await captureNativeContinuationBoundary(page, 2), trace = await closeNativeDecisionTrace(page);
      const body: Omit<NativeReplayCapsule, "payloadDigest"> = { schemaVersion: 1, sourceRevision: request.sourceRevision,
        fixtureDigest: request.fixtureDigest, mapId: "AI Open Economy (test only)", checkpoint, saved, control, trace,
        inputs: { fromTick: saved.owner.tick, throughTick: control.owner.tick, frameMilliseconds: 50,
          simulationTimeScale: 1, externalCommandCount: await closeNativeReplayInputWitness(page) } };
      const capsule: NativeReplayCapsule = { ...body, payloadDigest: nativeReplayCapsuleDigest(body) };
      const pure = await captureNativeDebugComparison(page, "identical", request.sourceRevision, null);
      const originalBeforeReplay = await nativeDebugWorldDigest(page);
      const copy = branch === "truncated_history" ? { ...capsule,
        inputs: { ...capsule.inputs, throughTick: control.owner.tick - 1 } } : branch === "source_map_config_mismatch" ?
        { ...capsule, fixtureDigest: "controlled-different-native-map-config" } : null;
      const rejectedCopy = copy ? nativeReplayCapsuleBlocker(copy, request.sourceRevision, request.fixtureDigest) : null;
      const mismatchBlockers = [
        { ...capsule, sourceRevision: "0".repeat(40) }, { ...capsule, mapId: "controlled-different-map" },
        { ...capsule, fixtureDigest: "controlled-different-config" }
      ].map((candidate) => nativeReplayCapsuleBlocker(candidate, request.sourceRevision, request.fixtureDigest));
      const physical = await reproduceNativeCapsule(browser, page.context(), fixture, variant, request, capsule,
        fixture.scenarioIds.includes("DBG-03"));
      nativeRepro = { ...physical, branch, sourceRevision: request.sourceRevision, fixtureDigest: request.fixtureDigest,
        rejectedCopy, mismatchBlockers, pure, originalBeforeReplay, originalAfterReplay: await nativeDebugWorldDigest(page) };
    });
  if (!nativeRepro) throw new Error("native_repro_result_missing");
  const { productionCapture: _capture, ...compact } = result;
  const nativeLiveWorkbench = fixture.scenarioIds.includes("DBG-03") && branch === "live_history_bookmark" ?
    await exerciseNativeLiveWorkbench(browser, request.seed ?? variant.seed, variant.aiFaction) : undefined;
  return { ...compact, nativeRepro, ...(nativeLiveWorkbench ? { nativeLiveWorkbench } : {}) };
}

async function reproduceNativeCapsule(
  browser: Browser, originalContext: BrowserContext, fixture: RuntimeFixtureV1, variant: RuntimeVariantV1,
  request: RuntimeRequestV1, capsule: NativeReplayCapsule, stepping: boolean
) {
  const session = await openNativeReplaySession(browser, fixture, variant, capsule, request.sourceRevision, request.fixtureDigest);
  try {
    await armNativeDecisionTrace(session.page, 2);
    const steps: Awaited<ReturnType<typeof stepNativeReplay>>[] = [];
    if (stepping) for (const kind of ["tick", "decision", "queue_progress"] as const)
      steps.push(await stepNativeReplay(session.page, kind, capsule.control.owner.tick));
    await advanceRuntimeFrames(session.page, 2, capsule.control.owner.tick);
    await session.page.waitForFunction(() => window.__fuzzyWaddleAiRuntimePartsV1?.(2)?.controller.isDecisionBoundarySettled());
    const resumed = await captureNativeContinuationBoundary(session.page, 2), trace = await closeNativeDecisionTrace(session.page);
    return { isolatedContext: session.context !== originalContext && session.page.context() !== originalContext,
      capsuleDigest: capsule.payloadDigest, restored: session.restored, saved: capsule.saved,
      control: capsule.control, resumed, controlTraceCount: capsule.trace.records.length, resumedTraceCount: trace.records.length,
      controlTraceDigest: digestCanonicalAiValue(capsule.trace.records), resumedTraceDigest: digestCanonicalAiValue(trace.records),
      overflow: capsule.trace.overflow || trace.overflow, steps, aiErrors: [...session.aiErrors] };
  } finally { await session.context.close(); }
}
