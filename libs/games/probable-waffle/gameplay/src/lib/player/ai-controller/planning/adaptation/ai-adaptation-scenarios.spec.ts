import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiProductionPolicyFixture } from "../../testing/fixtures/production/ai-production-policy-fixture";
import { createAiTestOwnedActor } from "../../testing/fixtures/coordination/ai-test-fixtures";
import type { AiObservedActor } from "../../contracts/observation/ai-observation";
import { adaptationRoleTargets, mergeAdaptationEvidence } from "./ai-adaptation-evidence";
import {
  combatActor,
  fixtureState,
  manager,
  observation,
  squad
} from "../../testing/fixtures/tactics/ai-tactics-test-fixtures";

describe("technology and counter scenario contracts", () => {
  it("admits a single water-control commitment for an eligible naval opening", () => {
    const baseline = fixtureState([]);
    const state = {
      ...baseline,
      opening: { ...baseline.opening, archetypeId: "opening:tivara:naval" }
    };

    expect(adaptationRoleTargets([], state)).toContainEqual(
      expect.objectContaining({ role: "water_control", desired: 1, evidenceIds: [] })
    );
  });

  it("scales air and water role targets with distinct confirmed objectives", () => {
    const state = fixtureState([]);
    type AdaptationEvidence = (typeof state.economyProduction.adaptation.evidence)[number];
    const evidence: AdaptationEvidence[] = [
      ...Array.from({ length: 3 }, (_, index) => ({
        evidenceId: `evidence:exposed:${index}` as AdaptationEvidence["evidenceId"],
        kind: "exposed_backline" as const,
        sourceContactId: `asset:${index}`,
        observedTick: 20,
        confidencePermille: 700,
        consecutiveEvaluations: 2,
        permittedFacts: ["visible_exposed_valuable_producer"]
      })),
      ...Array.from({ length: 4 }, (_, index) => ({
        evidenceId: `evidence:water:${index}` as AdaptationEvidence["evidenceId"],
        kind: "water_or_transport" as const,
        sourceContactId: `water-contact:${index}`,
        observedTick: 20,
        confidencePermille: 700,
        consecutiveEvaluations: 2,
        permittedFacts: ["visible_water_or_container"]
      }))
    ];

    expect(adaptationRoleTargets(evidence, state)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: "air_pressure", desired: 3 }),
        expect.objectContaining({ role: "water_control", desired: 4 })
      ])
    );
  });

  it("TECH-03: one observed air-production clue prepares one counter, confirmed flyers scale the response", () => {
    const f = createAiProductionPolicyFixture();
    const clue = {
      ...createAiTestOwnedActor("air-producer"),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const,
      housingCost: { status: "known" as const, value: 0, observedTick: 200 },
      capabilities: [
        {
          id: "clue:air",
          family: "produce_air",
          level: 1,
          domains: [],
          targetDomains: [],
          capacity: { status: "known" as const, value: 0, observedTick: 200 }
        }
      ]
    };
    const flyers = Array.from({ length: 4 }, (_, index) => combatActor(`flyer-${index}`, "enemy", 5, "air"));
    const evaluate = (actors: typeof f.observation.actors) => {
      const first = mergeAdaptationEvidence(f.state, { ...f.observation, actors });
      const nextState = {
        ...f.state,
        economyProduction: {
          ...f.state.economyProduction,
          adaptation: { ...f.state.economyProduction.adaptation, evidence: first }
        }
      };
      const evidence = mergeAdaptationEvidence(nextState, { ...f.observation, tick: 220, actors });
      return adaptationRoleTargets(evidence, nextState);
    };
    expect(evaluate([clue])).toContainEqual(expect.objectContaining({ role: "anti_air", desired: 1 }));
    expect(evaluate([clue, ...flyers])).toContainEqual(expect.objectContaining({ role: "anti_air", desired: 4 }));
    expect(evaluate([{ ...clue, visibility: "last_seen" }])).toEqual([]);
  });

  it("TECH-04: repeated sightings do not inflate mass; distinct confirmed contacts do", () => {
    const f = createAiProductionPolicyFixture();
    const flyers = Array.from({ length: 4 }, (_, index) => combatActor(`flyer-${index}`, "enemy", 5, "air"));
    let state = f.state;
    const firstFlyer = flyers[0];
    if (!firstFlyer) throw new Error("flyer_fixture_missing");
    for (let tick = 200; tick < 300; tick += 20) {
      const evidence = mergeAdaptationEvidence(state, { ...f.observation, tick, actors: [firstFlyer] });
      state = {
        ...state,
        economyProduction: {
          ...state.economyProduction,
          adaptation: { ...state.economyProduction.adaptation, evidence }
        }
      };
    }
    expect(adaptationRoleTargets(state.economyProduction.adaptation.evidence, state)).toContainEqual(
      expect.objectContaining({ role: "anti_air", desired: 1 })
    );
    for (const tick of [300, 320]) {
      const evidence = mergeAdaptationEvidence(state, { ...f.observation, tick, actors: flyers });
      state = {
        ...state,
        economyProduction: {
          ...state.economyProduction,
          adaptation: { ...state.economyProduction.adaptation, evidence }
        }
      };
    }
    expect(adaptationRoleTargets(state.economyProduction.adaptation.evidence, state)).toContainEqual(
      expect.objectContaining({ role: "anti_air", desired: 4 })
    );
  });

  it("TECH-06: an executable ranged alternative changes an armoured matchup without retreating a healthy force", () => {
    const enemyBase = combatActor("armoured", "enemy", 5, "ground", 1000, { damage: 30 });
    if (enemyBase.combatProfile?.status !== "known") throw new Error("enemy_profile_missing");
    const enemy = {
      ...enemyBase,
      combatProfile: {
        ...enemyBase.combatProfile,
        value: { ...enemyBase.combatProfile.value, maxArmour: 300, armourPermille: 1000 }
      }
    };
    const weak = combatActor("guard", "self", 2, "ground", 1000, { damage: 2 });
    const alternative = {
      ...combatActor("ranged-counter", "self", 2, "ground", 1000, { damage: 200 }),
      objectName: ObjectNames.TivaraSlingshotFemale
    };
    const evaluate = (actors: readonly AiObservedActor[]) =>
      manager.propose(
        observation(actors, 200),
        fixtureState([
          squad(
            "squad:matchup",
            "attack",
            actors.filter((actor) => actor.relation === "self").map((actor) => actor.actorId)
          )
        ])
      );
    const supported = evaluate([alternative, enemy]);
    expect(supported.intents.some((intent) => intent.kind === "attack")).toBe(true);
    const unavailable = evaluate([weak, enemy]);
    expect(unavailable.statePatch?.squadUpdates?.[0]?.state).toBe("engage");
    expect(unavailable.intents.some((intent) => intent.kind === "move")).toBe(false);
    expect(unavailable.intents.some((intent) => ["produce", "research"].includes(intent.kind))).toBe(false);
  });
});
