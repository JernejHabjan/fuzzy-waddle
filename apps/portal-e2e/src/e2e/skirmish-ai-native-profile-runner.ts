import type { Browser } from "@playwright/test";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";
import type { RuntimeRequestV1 } from "./skirmish-ai-runtime-request";
import { runNativeSaveVariant } from "./skirmish-ai-native-save-runner";
import { runNativeProfileTransfer } from "./skirmish-ai-native-profile-transfer";

/** SP save/replay and actual MP reconnect/promotion are separate supported legs with separate native evidence. */
export async function runNativeProfileVariant(
  browser: Browser, fixture: RuntimeFixtureV1, variant: RuntimeVariantV1, request: RuntimeRequestV1, branch: string
) {
  const pending = branch.endsWith("pending_plan");
  const interval = { Easy: 40, Normal: 20, Hard: 10 }[variant.difficulty];
  const result = await runNativeSaveVariant(browser, fixture, variant, request,
    pending ? "applied_pending" : "before_apply", pending ? 199 : interval - 1);
  const nativeProfileTransfer = branch.endsWith("host_transfer") ? await runNativeProfileTransfer(browser, {
    seed: request.seed ?? variant.seed, aiFaction: variant.aiFaction, aiDifficulty: variant.difficulty
  }) : undefined;
  return { ...result, ...(nativeProfileTransfer ? { nativeProfileTransfer } : {}) };
}
