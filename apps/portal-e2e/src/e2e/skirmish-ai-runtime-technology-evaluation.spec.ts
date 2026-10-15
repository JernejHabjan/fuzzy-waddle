import { expect, test } from "@playwright/test";
import { evaluateRuntimeTechnology } from "./skirmish-ai-runtime-technology-evaluation";
import { productionAuthorityFixture } from "./skirmish-ai-runtime-production-authority-fixture";
import { productionEvent } from "./skirmish-ai-runtime-production-contract-fixtures";
import type { RuntimeTechnologyContract } from "./skirmish-ai-runtime-technology-contract";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiIntentV1 } from "@fuzzy-waddle/probable-waffle-gameplay";

const contract: RuntimeTechnologyContract = {
  latestTick: 600,
  branch: "small_army",
  productObjectName: "TivaraMacemanMale",
  researchType: "tivaraMacemanUpgradeLevel2"
};

test("technology requires closed native authority and never passes an absent contract", () => {
  const { evidence } = productionAuthorityFixture();
  const variant = { productionEvidenceV2: evidence, checkpoints: [] };
  expect(evaluateRuntimeTechnology("TECH-01", contract, variant)).toEqual([]);
  expect(evaluateRuntimeTechnology("TECH-01", undefined, variant)).toEqual(["technology_contract_missing"]);
  expect(evaluateRuntimeTechnology("TECH-01", { ...contract, branch: "air_mass" }, variant)).toEqual([
    "technology_contract_invalid"
  ]);
  expect(evaluateRuntimeTechnology("TECH-01", contract, { checkpoints: [] })).toEqual([
    "technology_native_history_missing"
  ]);
  expect(
    evaluateRuntimeTechnology("TECH-01", contract, {
      ...variant,
      productionEvidenceV2: { ...evidence, gaps: ["unresolved_callback"] }
    })
  ).toEqual(["technology_native_history_missing"]);
});

test("an anti-air target or an unrelated completion cannot substitute for an executed counter", () => {
  const { evidence } = productionAuthorityFixture();
  const air = { ...contract, branch: "air_mass", counterCount: 1 } as const;
  const selected = evidence.decisions[0];
  if (!selected) throw new Error("selected_fixture_missing");
  const withTarget = {
    ...evidence,
    decisions: [
      {
        ...selected,
        result: {
          ...selected.result,
          economyProduction: {
            ...selected.result.economyProduction,
            adaptation: {
              ...selected.result.economyProduction.adaptation,
              activeRoleTargets: [{ role: "anti_air" as const, desired: 1, evidenceIds: [] }]
            }
          }
        }
      }
    ]
  };
  const variant = { productionEvidenceV2: withTarget, checkpoints: [] };
  expect(evaluateRuntimeTechnology("TECH-04", air, variant)).toEqual([
    "technology_counter_not_delivered",
    "technology_counterforce_incomplete"
  ]);
  expect(
    evaluateRuntimeTechnology("TECH-04", air, {
      ...variant,
      productionEvidenceV2: {
        ...withTarget,
        lifecycle: {
          ...withTarget.lifecycle,
          queues: [
            {
              ...productionEvent(1, 500, "complete", { createdActorId: "unrelated" }),
              applicationTick: 500,
              selectedSequence: null
            }
          ]
        }
      }
    })
  ).toEqual(["technology_counter_not_delivered", "technology_counterforce_incomplete"]);

  const targeted = withTarget.decisions[0];
  if (!targeted) throw new Error("targeted_fixture_missing");
  const input = selected.result.input;
  if (!input?.capabilityCatalog) throw new Error("oracle_input_missing");
  const counter: AiIntentV1 = {
    kind: "produce",
    intentId: "intent:counter",
    effectId: "effect:counter",
    planId: "plan:counter",
    demandId: "demand:adapt:anti_air",
    lane: "supply_production",
    proposedTick: 20,
    urgencyClass: 2,
    utility: 760,
    preconditions: [],
    claims: [],
    reasonCode: "oracle_control",
    producerId: "producer-1",
    objectName: ObjectNames.TivaraSlingshotFemale
  };
  const legal = {
    ...withTarget,
    decisions: [
      {
        ...selected,
        result: {
          ...targeted.result,
          acceptedIntents: [counter],
          input: {
            ...input,
            capabilityCatalog: {
              ...input.capabilityCatalog,
              entries: [
                {
                  capabilityId: "ranged",
                  sourceObjectName: ObjectNames.TivaraSlingshotFemale,
                  effectiveLevel: 1,
                  family: "ranged",
                  movementDomains: ["ground" as const],
                  targetDomains: ["air" as const],
                  produces: [],
                  constructs: [],
                  researches: [],
                  gathers: [],
                  housingCapacity: null,
                  housingCost: 1,
                  cargoCapacity: null
                }
              ]
            }
          }
        }
      }
    ],
    lifecycle: {
      ...withTarget.lifecycle,
      queues: [
        {
          ...productionEvent(1, 500, "complete", {
            effectId: "counter",
            actorId: "producer-1",
            productKey: ObjectNames.TivaraSlingshotFemale,
            createdActorId: "counter-1"
          }),
          applicationTick: 500,
          selectedSequence: null
        }
      ]
    }
  };
  expect(evaluateRuntimeTechnology("TECH-04", air, { productionEvidenceV2: legal, checkpoints: [] })).toEqual([]);
  expect(
    evaluateRuntimeTechnology("TECH-04", air, {
      productionEvidenceV2: {
        ...legal,
        lifecycle: {
          ...legal.lifecycle,
          queues: legal.lifecycle.queues.map((event) => ({ ...event, actorId: "wrong-producer" }))
        }
      },
      checkpoints: []
    })
  ).toContain("technology_counter_not_delivered");
});

test("research needs actual beneficiaries and completion, while matchup needs useful damage", () => {
  const { evidence } = productionAuthorityFixture();
  const variant = { productionEvidenceV2: evidence, checkpoints: [] };
  expect(evaluateRuntimeTechnology("TECH-01", { ...contract, branch: "mass_army" }, variant)).toEqual([
    "technology_beneficiaries_missing",
    "technology_research_not_completed_once"
  ]);
  expect(evaluateRuntimeTechnology("TECH-06", { ...contract, branch: "matchup" }, variant)).toContain(
    "technology_useful_matchup_effect_missing"
  );
});
