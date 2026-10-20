import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import { createAiProductionPolicyFixture } from "../testing/ai-production-policy-fixture";
import { createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { renewableFoodReserve } from "./ai-renewable-food-reserve";
import { proposeAiFoodEconomy } from "./ai-food-economy-proposal";
import { proposeAiWorkerRecovery } from "./ai-worker-recovery";

function fixture() {
  const f = createAiProductionPolicyFixture(), workerName = ObjectNames.TivaraWorkerMale;
  const entry = (sourceObjectName: ObjectNames, wood: number, requiredObjectNames: readonly ObjectNames[] = []) => ({
    ...f.catalog.entries[0], sourceObjectName, produces: [], constructs: [], gathers: [],
    constructionProfile: { resourceCost: { [ResourceType.Wood]: wood }, requiredObjectNames,
      footprintRadiusTiles: 0, visionRange: 6, navigableHeight: null, enterHeight: null, exitHeight: null }
  });
  const catalog: AiCapabilityCatalogV1 = { ...f.catalog, entries: [
    ...f.catalog.entries.filter((entry) => entry.sourceObjectName !== workerName),
    { ...entry(workerName, 10), gathers: [ResourceType.Food], constructs: [ObjectNames.Granary, ObjectNames.Field] },
    entry(ObjectNames.Field, 60, [ObjectNames.Granary]), entry(ObjectNames.Granary, 80)
  ] };
  const worker = { ...createAiTestOwnedActor("worker-0"), objectName: workerName };
  const producer = { ...f.producer };
  const producerEntry = catalog.entries.find((item) => item.sourceObjectName === producer.objectName);
  const withWorker = { ...catalog, entries: catalog.entries.map((item) => item !== producerEntry ? item
    : { ...item, produces: [workerName] }) };
  const observation = { ...f.observation, actors: [worker, producer], resources: f.observation.resources.map((resource) =>
    ({ ...resource, stockpile: resource.resourceType === ResourceType.Wood ? 140 : 0 })) };
  return { ...f, workerName, catalog: withWorker, worker, producer, observation };
}

it("reserves the whole missing prerequisite closure, without charging a paid unfinished prerequisite twice", () => {
  const f = fixture();
  expect(renewableFoodReserve([f.worker], f.catalog)).toEqual({ wood: 140 });
  const paid = { ...createAiTestOwnedActor("paid-granary"), objectName: ObjectNames.Granary };
  expect(renewableFoodReserve([f.worker, paid], f.catalog)).toEqual({ wood: 60 });
  const unknown = { ...f.catalog, entries: f.catalog.entries.filter((entry) => entry.sourceObjectName !== ObjectNames.Granary) };
  expect(renewableFoodReserve([f.worker], unknown)).toBeNull();
});

it("keeps the last complete chain budget instead of buying an extra worker, but allows the first legal worker", () => {
  const f = fixture(), workerName = f.workerName, reserve = renewableFoodReserve([f.worker], f.catalog);
  expect(proposeAiWorkerRecovery(f.observation, f.state, f.catalog, workerName, 6, undefined, {}, reserve).intent).toBeNull();
  const bootstrap = { ...f.observation, actors: [f.producer] };
  expect(proposeAiWorkerRecovery(bootstrap, f.state, f.catalog, workerName, 6, undefined, {}, reserve).intent?.kind).toBe("produce");
});

it("requests the first renewable source with one living worker before the opening finishes", () => {
  const f = fixture(), workerName = f.workerName, demands: Parameters<typeof proposeAiFoodEconomy>[0]["demands"] = [];
  proposeAiFoodEconomy({ observation: f.observation, state: f.state, catalog: f.catalog, self: f.observation.actors,
    pressureForecast: [], openingComplete: false, workerRequiredObject: workerName, reservedActorIds: new Set(),
    selectedConstructionTileKeys: new Set(), demands, intents: [], ordinal: 0 });
  expect(demands.find((demand) => demand.capabilityOrRole === ObjectNames.Field)?.desired).toBe(1);
});
