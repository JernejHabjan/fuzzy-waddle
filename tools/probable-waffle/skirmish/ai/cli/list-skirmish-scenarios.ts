#!/usr/bin/env node
import { collectRuntimeInventory, renderRuntimeInventory } from "../scenarios/catalog/skirmish-runtime-inventory.ts";
import { fixtureDirectory } from "../shared/workspace-paths.ts";
import { readNativeScenarioFixture } from "../scenarios/registration/read-native-scenario-fixture.ts";
import { readScenarioManifest, validateScenarioRequirements } from "./scenario-requirements.ts";

const manifest = readScenarioManifest();
validateScenarioRequirements(manifest);
const inventory = collectRuntimeInventory(manifest, (reference) =>
  readNativeScenarioFixture(fixtureDirectory, reference)
);
process.stdout.write(renderRuntimeInventory(inventory));
