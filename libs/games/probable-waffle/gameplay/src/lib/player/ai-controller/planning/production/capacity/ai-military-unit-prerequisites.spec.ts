import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiTestOwnedActor } from "../../../testing/fixtures/coordination/ai-test-fixtures";
import { createAiProductionPolicyFixture } from "../../../testing/fixtures/production/ai-production-policy-fixture";
import { proposeAiMilitaryUnits } from "./ai-military-unit-proposal";

describe("military production prerequisites", () => {
  it("waits for a finished prerequisite and uses a legal alternative when one exists", () => {
    const f = createAiProductionPolicyFixture();
    const unit = f.catalog.entries.find((entry) => entry.sourceObjectName === f.unitName);
    if (!unit?.constructionProfile) throw new Error("Fixture needs a priced military unit");
    const restricted = {
      ...unit,
      constructionProfile: { ...unit.constructionProfile, requiredObjectNames: [ObjectNames.Temple] }
    };
    const catalog = { ...f.catalog, entries: f.catalog.entries.map((entry) => (entry === unit ? restricted : entry)) };
    const propose = (actors: typeof f.observation.actors, withAlternative = false) =>
      proposeAiMilitaryUnits({
        observation: { ...f.observation, actors },
        state: f.state,
        catalog: withAlternative
          ? {
              ...catalog,
              entries: [
                ...catalog.entries.map((entry) =>
                  entry.sourceObjectName === f.producerName
                    ? { ...entry, produces: [...entry.produces, ObjectNames.TivaraSlingshotFemale] }
                    : entry
                ),
                { ...unit, sourceObjectName: ObjectNames.TivaraSlingshotFemale }
              ]
            }
          : catalog,
        producers: [f.producer],
        military: [],
        queuedMilitary: [],
        acceptedEffectCount: 0,
        targetMilitary: 2,
        rangedPermille: 0,
        pressureDomain: "ground",
        compositionPrefix: "test",
        workforceRecoveryOwnsFood: false,
        priorIntents: [],
        ordinal: 0
      });
    const temple = {
      ...createAiTestOwnedActor("temple"),
      objectName: ObjectNames.Temple,
      constructionProgress: { status: "known" as const, value: 50, observedTick: 200 }
    };
    expect(propose(f.observation.actors)).toEqual([]);
    expect(propose([...f.observation.actors, temple])).toEqual([]);
    expect(propose(f.observation.actors, true)).toContainEqual(
      expect.objectContaining({ objectName: ObjectNames.TivaraSlingshotFemale })
    );
    expect(
      propose([
        ...f.observation.actors,
        { ...temple, constructionProgress: { ...temple.constructionProgress, value: 100 } }
      ])
    ).toContainEqual(expect.objectContaining({ objectName: f.unitName }));
  });
});
