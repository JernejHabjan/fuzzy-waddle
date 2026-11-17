import { join } from "node:path";
import { readJson } from "../../matrix/skirmish-matrix-io.ts";
import { nativeScenarioFixture } from "./native-scenario-registration.ts";

/** Reads a fixture file and expands intentionally generated native worlds before a consumer sees them. */
export function readNativeScenarioFixture(fixtureDirectory: string, reference: string): any {
  const fixture = readJson(join(fixtureDirectory, reference), 1024 * 1024);
  const generatedScenarioId = fixture?.generatedScenarioId;
  if (generatedScenarioId === "SCOUT-02" || generatedScenarioId === "WALL-02") {
    return nativeScenarioFixture(generatedScenarioId);
  }
  if (generatedScenarioId !== undefined) throw new Error(`unknown_generated_native_scenario:${generatedScenarioId}`);
  return fixture;
}
