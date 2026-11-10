import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiTestOwnedActor } from "../../testing/fixtures/coordination/ai-test-fixtures";
import { createAiProductionPolicyFixture } from "../../testing/fixtures/production/ai-production-policy-fixture";
import { projectAiManagerState } from "../../brain/state/project-ai-manager-state";
import { AiAdaptationManager } from "./ai-adaptation-manager";
import { proposeAiCounterInfrastructure } from "./ai-counter-infrastructure-proposal";
import { AiMacroManager } from "../production/macro/ai-macro-manager";

it("constructs a missing counter prerequisite only for confirmed unfilled air demand", () => {
  const f = createAiProductionPolicyFixture();
  const worker = f.catalog.entries.find((entry) => entry.constructs.includes(f.producerName));
  const producer = f.catalog.entries.find((entry) => entry.sourceObjectName === f.producerName);
  const unit = f.catalog.entries.find((entry) => entry.sourceObjectName === f.unitName);
  if (!worker || !producer?.constructionProfile || !unit?.constructionProfile) throw new Error("Invalid fixture");
  const temple = {
    ...producer,
    sourceObjectName: ObjectNames.Temple,
    produces: [],
    constructionProfile: {
      ...producer.constructionProfile,
      footprintRadiusTiles: 0,
      requiredObjectNames: [f.producerName]
    }
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
  const flyer = {
    ...createAiTestOwnedActor("flyer"),
    objectName: ObjectNames.SkaduweeOwl,
    relation: "enemy" as const,
    visibility: "visible" as const,
    owner: 2,
    capabilities: [
      {
        id: "air",
        family: "attack",
        level: 1,
        domains: ["air" as const],
        targetDomains: ["ground" as const],
        capacity: { status: "known" as const, value: 0, observedTick: 200 }
      }
    ]
  };
  const observation = { ...f.observation, actors: [...f.observation.actors, flyer] };
  const manager = new AiAdaptationManager(f.profile, () => catalog);
  const first = projectAiManagerState(f.state, [manager.propose(observation, f.state)]);
  const confirmed = projectAiManagerState(first, [manager.propose(observation, first)]);
  const propose = (world = observation, state = confirmed) =>
    proposeAiCounterInfrastructure({
      observation: world,
      state,
      catalog,
      self: world.actors.filter((actor) => actor.relation === "self"),
      reservedActorIds: new Set(),
      selectedConstructionTileKeys: new Set(),
      priorIntents: [],
      ordinal: 0
    });
  expect(propose()).toMatchObject({ kind: "construct", objectName: ObjectNames.Temple });
  expect(new AiMacroManager(() => catalog).propose(observation, confirmed).intents).toContainEqual(
    expect.objectContaining({ kind: "construct", objectName: ObjectNames.Temple })
  );
  expect(propose(observation, first)).toBeNull();
  expect(
    propose(observation, {
      ...confirmed,
      reservations: [
        ...confirmed.reservations,
        {
          claimId: "claim:capacity:pending",
          subjectKey: "effect:capacity:Temple:effect:1:0",
          ownerPlanId: confirmed.opening.plan.planId,
          state: { kind: "applied_spending", appliedTick: 190 },
          prerequisites: [],
          createdTick: 190
        }
      ]
    })
  ).toBeNull();
  expect(
    propose({ ...observation, actors: observation.actors.filter((actor) => actor.actorId !== flyer.actorId) })
  ).toBeNull();
  const unfinished = {
    ...createAiTestOwnedActor("temple"),
    objectName: ObjectNames.Temple,
    constructionProgress: { status: "known" as const, value: 50, observedTick: 200 }
  };
  expect(propose({ ...observation, actors: [...observation.actors, unfinished] })).toBeNull();
  const ready = { ...unfinished, constructionProgress: { ...unfinished.constructionProgress, value: 100 } };
  expect(propose({ ...observation, actors: [...observation.actors, ready] })).toBeNull();
  const existingDemand = confirmed.economyProduction.demands.find(
    (demand) => demand.demandId === "demand:adapt:anti_air"
  );
  if (!existingDemand) throw new Error("Missing counter demand");
  expect(
    propose(observation, {
      ...confirmed,
      economyProduction: {
        ...confirmed.economyProduction,
        demands: [
          ...confirmed.economyProduction.demands,
          {
            ...existingDemand,
            demandId: "demand:test" as typeof existingDemand.demandId,
            preferredObjectNames: [ObjectNames.Temple],
            acceptedNotObservedEffectIds: [
              "effect:paid" as (typeof existingDemand.acceptedNotObservedEffectIds)[number]
            ]
          }
        ]
      }
    })
  ).toBeNull();
  expect(
    propose({
      ...observation,
      resources: observation.resources.map((resource) => ({
        ...resource,
        stockpile: resource.resourceType === ResourceType.Wood ? 0 : resource.stockpile
      }))
    })
  ).toBeNull();
});
