import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiProductionPolicyFixture } from "../testing/ai-production-policy-fixture";
import { createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import type { AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { adaptationRoleTargets, mergeAdaptationEvidence } from "./ai-adaptation-evidence";
import { combatActor, fixtureState, manager, observation, squad } from "./ai-tactics-test-fixtures";

describe("technology and counter scenario contracts", () => {
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

  it("TECH-06: an executable ranged alternative changes an armoured matchup; unavailable counters use retreat", () => {
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
    const evaluate = (actors: readonly AiObservedActorV1[]) =>
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
    expect(unavailable.statePatch?.squadUpdates?.[0]?.state).toBe("retreat");
    expect(unavailable.intents.some((intent) => intent.kind === "move")).toBe(true);
    expect(unavailable.intents.some((intent) => ["produce", "research", "attack"].includes(intent.kind))).toBe(false);
  });
});
