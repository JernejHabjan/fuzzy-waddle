import type { ProbableWaffleGameInstance } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeBrowserTestConfig } from "../main/ai-runtime-browser-test-host";

/** A preset belongs only to the local match object that launched it. It is never stored in the tab or a save. */
export const activeAiScenarios = new WeakMap<ProbableWaffleGameInstance, {
  readonly title: string;
  readonly config: AiRuntimeBrowserTestConfig;
}>();
