import { createAiProductionPolicyFixture, createAiProducerThreat } from "../testing/ai-production-policy-fixture";
import { hasCredibleAiEconomyThreat } from "./ai-economy-policy";
import { isAiProducerPositionExposed } from "./ai-producer-safety";

it("uses native floored range while distinguishing exposed military capacity from threatened essential economy", () => {
  const f = createAiProductionPolicyFixture();
  const enemy = createAiProducerThreat();
  if (!enemy || enemy.combatProfile?.status !== "known") throw new Error("fixture_threat_missing");
  const known = <T>(value: T) => ({ status: "known" as const, value, observedTick: 200 });
  const producer = { ...f.producer, logicalPosition: known({ x: 20, y: 20, z: 0 }) };
  const threat = {
    ...enemy,
    logicalPosition: known({ x: 26, y: 25, z: 0 }),
    combatProfile: {
      ...enemy.combatProfile,
      value: {
        ...enemy.combatProfile.value,
        attacks: enemy.combatProfile.value.attacks.map((attack) => ({ ...attack, range: 7, minRange: 3 }))
      }
    }
  };
  expect(isAiProducerPositionExposed({ x: 20, y: 20, z: 0 }, [threat])).toBe(true);
  expect(isAiProducerPositionExposed({ x: 19, y: 19, z: 0 }, [threat])).toBe(false);
  const nearby = { ...threat, logicalPosition: known({ x: 21, y: 20, z: 0 }) };
  const observation = {
    ...f.observation,
    actors: [producer, nearby],
    threatSummary: { ...f.observation.threatSummary, visibleEnemyActorIds: [nearby.actorId] }
  };
  expect(hasCredibleAiEconomyThreat(observation)).toBe(false);
  expect(
    hasCredibleAiEconomyThreat({ ...observation, actors: [{ ...producer, mainBuilding: known(true) }, nearby] })
  ).toBe(true);
  expect(
    hasCredibleAiEconomyThreat({
      ...observation,
      actors: [
        {
          ...producer,
          logicalPosition: producer.logicalPosition,
          capabilities: [
            { id: "gather", family: "gather", level: 1, domains: ["ground"], targetDomains: [], capacity: known(1) }
          ]
        },
        nearby
      ]
    })
  ).toBe(true);
});
