import bindings from "@fuzzy-waddle/probable-waffle-skirmish-ai-tools/testing/bindings/native-scenario-bindings.json";

/** Resolve only declared scenario bindings; unknown IDs remain unavailable to both evaluators. */
export function nativeScenarioBinding(id: string) {
  return Object.entries(bindings.cases).find(([scenarioId]) => scenarioId === id)?.[1];
}
