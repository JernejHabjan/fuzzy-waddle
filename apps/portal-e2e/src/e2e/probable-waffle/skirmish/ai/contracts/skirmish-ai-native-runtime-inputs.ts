import type { Page } from "@playwright/test";
import type { AiRuntimeBrowserTestConfig } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/browser/ai-runtime-browser-test-config-contract";
import type { RuntimePresetWorld } from "../setup/skirmish-ai-runtime-preset-world";

type RuntimeInput = Omit<AiRuntimeBrowserTestConfig, "presetWorld"> & { readonly presetWorld?: RuntimePresetWorld & {
  readonly provenance: { readonly sourceRevision: string; readonly fixtureDigest: string } } };

/** A second match changes diagnostic inputs in the retained realm; initial matches install them before document bootstrap. */
export async function installNativeRuntimeInputs(page: Page, config: RuntimeInput, sameRealm: boolean) {
  const install = (value: RuntimeInput) => {
    window.sessionStorage.setItem("fuzzy-waddle:ai-runtime-browser-test", JSON.stringify(value));
  };
  if (sameRealm) await page.evaluate(install, config);
  else await page.addInitScript(install, config);
}
