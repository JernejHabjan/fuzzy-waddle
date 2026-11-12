import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiTestOwnedActor } from "../../testing/fixtures/coordination/ai-test-fixtures";
import { createAiProductionPolicyFixture } from "../../testing/fixtures/production/ai-production-policy-fixture";
import { counterInfrastructurePath } from "./ai-counter-infrastructure-path";

it("finds a legal prerequisite chain and stops once an existing route is ready", () => {
  const f = createAiProductionPolicyFixture();
  const worker = f.catalog.entries.find((entry) => entry.constructs.includes(f.producerName));
  const producer = f.catalog.entries.find((entry) => entry.sourceObjectName === f.producerName);
  const unit = f.catalog.entries.find((entry) => entry.sourceObjectName === f.unitName);
  if (!worker || !producer?.constructionProfile || !unit?.constructionProfile) throw new Error("Invalid fixture");
  const producerProfile = producer.constructionProfile;
  const temple = {
    ...producer,
    sourceObjectName: ObjectNames.Temple,
    produces: [],
    constructionProfile: { ...producer.constructionProfile, requiredObjectNames: [f.producerName] }
  };
  const catalog = {
    ...f.catalog,
    entries: [
      { ...worker, constructs: [...worker.constructs, ObjectNames.Temple] },
      producer,
      {
        ...unit,
        targetDomains: ["air" as const],
        constructionProfile: {
          ...unit.constructionProfile,
          requiredObjectNames: [ObjectNames.Temple]
        }
      },
      temple
    ]
  };
  const workers = f.observation.actors.filter((actor) => actor.objectName === worker.sourceObjectName);
  expect(counterInfrastructurePath(catalog, workers)).toEqual([f.producerName, ObjectNames.Temple]);
  expect(counterInfrastructurePath(catalog, [...workers, f.producer])).toEqual([ObjectNames.Temple]);
  const finishedTemple = { ...createAiTestOwnedActor("temple"), objectName: ObjectNames.Temple };
  expect(counterInfrastructurePath(catalog, [...workers, f.producer, finishedTemple])).toEqual([]);
  expect(counterInfrastructurePath(catalog, [])).toBeUndefined();
  const cycle = {
    ...catalog,
    entries: catalog.entries.map((entry) =>
      entry.sourceObjectName === f.producerName
        ? {
            ...entry,
            constructionProfile: { ...producerProfile, requiredObjectNames: [ObjectNames.Temple] }
          }
        : entry
    )
  };
  expect(counterInfrastructurePath(cycle, workers)).toBeUndefined();
});
