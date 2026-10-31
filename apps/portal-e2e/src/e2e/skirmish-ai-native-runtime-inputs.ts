import type { Page } from "@playwright/test";
import type { AiRuntimeBrowserTestConfigV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-browser-test-config-v1";
import type { RuntimePresetWorldV1 } from "./skirmish-ai-runtime-preset-world";

type RuntimeInput = Omit<AiRuntimeBrowserTestConfigV1, "presetWorld"> & { readonly presetWorld?: RuntimePresetWorldV1 & {
  readonly provenance: { readonly sourceRevision: string; readonly fixtureDigest: string } } };

/** A second match changes diagnostic inputs in the retained realm; initial matches install them before document bootstrap. */
export async function installNativeRuntimeInputs(page: Page, config: RuntimeInput, sameRealm: boolean) {
  const install = (value: RuntimeInput) => {
    window.sessionStorage.setItem("fuzzy-waddle:ai-runtime-browser-test-v1", JSON.stringify(value));
  };
  if (sameRealm) await page.evaluate(install, config);
  else await page.addInitScript(install, config);
}
