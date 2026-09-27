import { FactionType, ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { digestCanonicalAiValue } from "../brain/canonical-ai-serialization";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import { decideAiEconomyPolicy, hasCredibleAiEconomyThreat } from "../planning/ai-economy-policy";
import { createAiTestObservation, createAiTestOwnedActor, unknownAiValue } from "./ai-test-fixtures";

const catalog: AiCapabilityCatalogV1 = {
  schemaVersion: 1, generation: 1, unsupported: [],
  entries: [{
    capabilityId: "worker", family: "worker", sourceObjectName: ObjectNames.TivaraWorker,
    effectiveLevel: 1, movementDomains: ["ground"], targetDomains: [],
    produces: [], constructs: [], researches: [], gathers: [ResourceType.Food, ResourceType.Wood],
    housingCapacity: null, housingCost: 1, cargoCapacity: null
  }]
};
const forecasts = [{ resourceType: ResourceType.Wood, amount: 600 }];

function economyWorld(contact: "none" | "local" | "remembered" | "remote"): AiObservationV1 {
  const base = createAiTestObservation();
  const workers = Array.from({ length: 8 }, (_, index) => createAiTestOwnedActor(`worker-${index}`));
  const field = {
    ...createAiTestOwnedActor("field"),
    objectName: ObjectNames.Field,
    resourceState: {
      status: "known" as const,
      observedTick: 20,
      value: {
        resourceType: ResourceType.Food,
        available: { status: "known" as const, value: 100, observedTick: 20 },
        carried: unknownAiValue,
        growthReadyTick: unknownAiValue,
        serviceCapacity: { status: "known" as const, value: 10, observedTick: 20 }
      }
    }
  };
  const enemy = {
    ...createAiTestOwnedActor("raider"),
    objectName: ObjectNames.Banshee,
    owner: 2,
    relation: "enemy" as const,
    visibility: contact === "remembered" ? "last_seen" as const : "visible" as const,
    logicalPosition: {
      status: "known" as const,
      value: contact === "remote" ? { x: 100, y: 100, z: 0 } : { x: 8, y: 5, z: 0 },
      observedTick: 20
    }
  };
  return {
    ...base,
    faction: FactionType.Tivara,
    actors: [...workers, field, ...(contact === "none" ? [] : [enemy])],
    resources: [ResourceType.Food, ResourceType.Wood, ResourceType.Stone, ResourceType.Minerals].map(
      (resourceType) => ({
        resourceType, stockpile: 200, reservedUnspent: 0, obligationsDue: 0,
        deliveredIncomePerMinute: { status: "known" as const, value: 0, observedTick: 20 }
      })
    ),
    threatSummary: {
      ...base.threatSummary,
      visibleEnemyActorIds: contact === "local" || contact === "remote" ? ["raider"] : [],
      rememberedEnemyActorIds: contact === "remembered" ? ["raider"] : []
    }
  };
}

describe("STRAT-01 paired early-raid economy policy", () => {
  it("does not freeze home growth for enemy contact near an outbound military actor", () => {
    const remote = economyWorld("remote");
    const soldier = {
      ...createAiTestOwnedActor("outbound-guard"),
      objectName: ObjectNames.TivaraMacemanMale,
      logicalPosition: { status: "known" as const, value: { x: 99, y: 100, z: 0 }, observedTick: 20 },
      capabilities: [{
        id: "outbound-guard:attack", family: "military", level: 1,
        domains: ["ground" as const], targetDomains: ["ground" as const],
        capacity: { status: "known" as const, value: 0, observedTick: 20 }
      }]
    };
    const outboundWorld = { ...remote, actors: [...remote.actors, soldier] };
    expect(hasCredibleAiEconomyThreat(outboundWorld)).toBe(false);
    expect(decideAiEconomyPolicy(outboundWorld, catalog, forecasts).budget)
      .toEqual({ economyPermille: 650, defensePermille: 350 });
    const core = {
      ...createAiTestOwnedActor("exposed-core"),
      logicalPosition: { status: "known" as const, value: { x: 99, y: 100, z: 0 }, observedTick: 20 },
      mainBuilding: { status: "known" as const, value: true, observedTick: 20 }
    };
    expect(hasCredibleAiEconomyThreat({ ...remote, actors: [...remote.actors, core] })).toBe(true);
  });

  it("diverts the 200-resource budget only for a visible local threat and resumes growth after pressure", () => {
    expect(economyWorld("none").resources.map((resource) => resource.stockpile)).toEqual([200, 200, 200, 200]);
    const safe = decideAiEconomyPolicy(economyWorld("none"), catalog, forecasts);
    const raided = decideAiEconomyPolicy(economyWorld("local"), catalog, forecasts);
    const hidden = decideAiEconomyPolicy(economyWorld("remembered"), catalog, forecasts);
    const remote = decideAiEconomyPolicy(economyWorld("remote"), catalog, forecasts);

    expect(safe.desiredWorkers).toBeGreaterThan(8);
    expect(safe.budget).toEqual({ economyPermille: 650, defensePermille: 350 });
    expect(raided.desiredWorkers).toBe(8);
    expect(raided.budget).toEqual({ economyPermille: 200, defensePermille: 800 });
    expect(hidden.budget).toEqual(safe.budget);
    expect(remote.budget).toEqual(safe.budget);
    expect(digestCanonicalAiValue(hidden)).toBe(digestCanonicalAiValue(safe));

    const recoveryWorld = { ...economyWorld("remembered"), tick: 200 };
    const recovered = decideAiEconomyPolicy(recoveryWorld, catalog, forecasts, false, raided.postureState);
    expect(recovered.posture).toBe("safe");
    expect(recovered.desiredWorkers).toBeGreaterThan(8);
  });

  it("repeats the same paired decision digest across three deterministic evaluations", () => {
    const safe = Array.from({ length: 3 }, () =>
      digestCanonicalAiValue(decideAiEconomyPolicy(economyWorld("none"), catalog, forecasts))
    );
    const raided = Array.from({ length: 3 }, () =>
      digestCanonicalAiValue(decideAiEconomyPolicy(economyWorld("local"), catalog, forecasts))
    );
    expect(new Set(safe).size).toBe(1);
    expect(new Set(raided).size).toBe(1);
    expect(safe[0]).not.toBe(raided[0]);
  });
});
