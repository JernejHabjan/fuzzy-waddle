import type { Page } from "@playwright/test";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";
import { leaveNativeMatchInSameRealm } from "./skirmish-ai-native-game-menu";
import { prepareRuntimeVariant } from "./skirmish-ai-runtime-variant-setup";
import { readNativeSceneOwnership } from "./skirmish-ai-native-scene-ownership";
import { advanceRuntimeFrames } from "./skirmish-ai-runtime-frame-driver";
import { nativeDebugWorldDigest } from "./skirmish-ai-native-debug-comparison";
import { deliverRetainedNativeSceneWork } from "./skirmish-ai-native-retained-work";
import type { NativeLifecycleProof } from "./skirmish-ai-native-lifecycle-proof";

/** End through the game UI and start the next native scene in the original JavaScript realm. */
export async function transitionNativeLifecycle(
  page: Page, fixture: RuntimeFixtureV1, variant: RuntimeVariantV1, branch: string,
  originalPlayer: number, sourceRevision: string, fixtureDigest: string
): Promise<NativeLifecycleProof> {
  const original = await readNativeSceneOwnership(page, originalPlayer);
  await leaveNativeMatchInSameRealm(page);
  const nextVariant: RuntimeVariantV1 = { ...variant, id: `${variant.id}-next`, seed: original.seed + 1,
    mapLabel: "AI Open Economy (test only)", executionKind: "focused_preset",
    presetWorld: { ...(variant.nextMatchPresetWorld ?? variant.presetWorld!), fixtureId: `${variant.id}-next`,
      events: [], routeOutages: [] }, checkpointTicks: [200] };
  const nextFixture: RuntimeFixtureV1 = { ...fixture, recipe: { ...fixture.recipe, aiPlayerNumber: 2,
    mapLabel: nextVariant.mapLabel!, variants: [nextVariant] } };
  const nextAiErrors: string[] = [];
  await prepareRuntimeVariant(page, nextFixture, nextVariant, nextVariant.seed, sourceRevision, fixtureDigest,
    false, nextAiErrors, undefined, true);
  const nextInitial = await readNativeSceneOwnership(page, 2);
  const nativeBeforeLateWork = await nativeDebugWorldDigest(page);
  const retained = await deliverRetainedNativeSceneWork(page);
  let retainedAuthorityUnchanged: boolean | undefined;
  if (branch === "host_replacement") retainedAuthorityUnchanged = await page.evaluate(() => {
    const realm = window as unknown as { __fuzzyWaddleRetainedAuthorityReplayV1?: () => boolean };
    if (!realm.__fuzzyWaddleRetainedAuthorityReplayV1) throw new Error("lifecycle_original_authority_callback_missing");
    const unchanged = realm.__fuzzyWaddleRetainedAuthorityReplayV1();
    delete realm.__fuzzyWaddleRetainedAuthorityReplayV1;
    return unchanged;
  });
  const nativeAfterLateWork = await nativeDebugWorldDigest(page);
  await advanceRuntimeFrames(page, 2, 200);
  return { branch, sourceRevision, fixtureDigest, original, nextInitial,
    nextActive: await readNativeSceneOwnership(page, 2), nativeBeforeLateWork, nativeAfterLateWork, retained,
    nextAiErrors: [...nextAiErrors],
    ...(retainedAuthorityUnchanged === undefined ? {} : { retainedAuthorityUnchanged }) };
}
