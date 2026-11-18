import { join } from "node:path";
import { readJson } from "../../matrix/skirmish-matrix-io.ts";
import { nativeScenarioFixture } from "./native-scenario-registration.ts";

/** Reads a fixture file and expands intentionally generated native worlds before a consumer sees them. */
export function readNativeScenarioFixture(fixtureDirectory: string, reference: string) {
  const fixture = readJson(join(fixtureDirectory, reference), 1024 * 1024);
  const generatedScenarioId = fixture?.generatedScenarioId;
  if (
    ["SCOUT-02", "WALL-02", "PLACE-01", "FIGHT-01", "WALL-04", "H-23", "H-25", "RAID-03"].includes(generatedScenarioId)
  ) {
    return nativeScenarioFixture(generatedScenarioId);
  }
  if (generatedScenarioId !== undefined) throw new Error(`unknown_generated_native_scenario:${generatedScenarioId}`);
  return fixture;
}
