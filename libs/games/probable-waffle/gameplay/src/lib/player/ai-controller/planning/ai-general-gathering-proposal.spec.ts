import { ObjectNames, ProbableWaffleAiDifficulty, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { proposeAiGeneralGathering } from "./ai-general-gathering-proposal";
import { readAiGatheringSelection } from "./ai-gathering-selection-observation";
import { rememberAiResourceInputRead } from "./ai-resource-input-observation";

/** Real pure proposal inputs; synthetic world/capability does not prove live resource service. */
function fixture() {
  const base = createAiTestObservation();
  const worker = { ...createAiTestOwnedActor("worker"),
    activeOrder: { status: "known", value: null, observedTick: base.tick } } as const;
  const source = { ...createAiTestOwnedActor("source"), relation: "neutral", resourceState: { status: "known",
    observedTick: base.tick, value: { resourceType: ResourceType.Wood,
      available: { status: "known", value: 100, observedTick: base.tick },
      carried: { status: "unknown", reason: "not_observed" }, growthReadyTick: { status: "unknown", reason: "not_observed" },
      serviceCapacity: { status: "known", value: 4, observedTick: base.tick } } } } as const;
  const observation = { ...base, actors: [worker, source] } satisfies AiObservationV1;
  const catalog = { schemaVersion: 1, generation: 1, unsupported: [], entries: [{ capabilityId: "gather", family: "worker",
    sourceObjectName: ObjectNames.TivaraWorker, effectiveLevel: 1, movementDomains: ["ground"], targetDomains: [],
    produces: [], constructs: [], researches: [], gathers: [ResourceType.Wood], housingCapacity: null,
    housingCost: 1, cargoCapacity: null }] } satisfies AiCapabilityCatalogV1;
  const initial = createAiBrainStateV1({ playerNumber: 1, faction: base.faction, tick: base.tick, archetypeId: "balanced",
    profile: createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium) });
  const state = { ...initial, economyProduction: { ...initial.economyProduction, forecasts: [
    { resourceType: ResourceType.Wood, amount: 100, horizonTick: 620, confidencePermille: 800 },
    { resourceType: ResourceType.Wood, amount: 200, horizonTick: 620, confidencePermille: 800 }
  ] } };
  const propose = () => proposeAiGeneralGathering(observation, state, catalog, [worker], [], new Set(), 0);
  return { observation, state, propose };
}

describe("consumed gathering selection", () => {
  it("retains the actual consumed observation marker without changing the saved intent", () => {
    const f = fixture();
    const marker = { captureEpoch: 1, lossEpoch: 0, sequence: 5, playerNumber: 1, generation: f.observation.generation };
    rememberAiResourceInputRead(f.observation, marker);
    const intent = f.propose();
    if (!intent) throw new Error("gathering_fixture_missing");
    expect(readAiGatheringSelection(intent)?.resourceInputRead).toEqual(marker);
    expect(intent).not.toHaveProperty("resourceInputRead");
  });
  it("retains the winning duplicate-resource entry before later forecast/ledger mutation", () => {
    const f = fixture(), intent = f.propose();
    if (!intent) throw new Error("gathering_fixture_missing");
    f.state.economyProduction.forecasts = [];
    f.observation.resources = [];
    expect(readAiGatheringSelection(intent)).toMatchObject({ branch: "forecast", forecast: { amount: 200 },
      ledger: { stockpile: 100, reservedUnspent: 10, obligationsDue: 20 }, plannerDeficit: 115 });
    expect(intent.demandId).toBeNull();
    expect(readAiGatheringSelection(structuredClone(intent))).toBeUndefined();
  });
  it("preserves the native nonpositive choice and explicitly records fallback without inventing a forecast", () => {
    const f = fixture();
    f.state.economyProduction.forecasts = [{ resourceType: ResourceType.Wood, amount: 0,
      horizonTick: 620, confidencePermille: 0 }];
    const nonpositive = f.propose();
    if (!nonpositive) throw new Error("gathering_fixture_missing");
    expect(readAiGatheringSelection(nonpositive)).toMatchObject({ branch: "forecast", plannerDeficit: -85 });
    f.state.economyProduction.forecasts = [];
    const fallback = f.propose();
    if (!fallback) throw new Error("gathering_fixture_missing");
    expect(readAiGatheringSelection(fallback)).toMatchObject({ branch: "stockpile_fallback", forecast: null,
      plannerDeficit: null });
  });
});
