import { readNativeScenarioFixture } from "../scenarios/registration/read-native-scenario-fixture.ts";
import { fixtureDirectory } from "../shared/workspace-paths.ts";

const reference = process.argv[2];
if (!reference || !/^native\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.json$/.test(reference)) {
  throw new Error("invalid_runtime_fixture_reference");
}
process.stdout.write(JSON.stringify(readNativeScenarioFixture(fixtureDirectory, reference)));
