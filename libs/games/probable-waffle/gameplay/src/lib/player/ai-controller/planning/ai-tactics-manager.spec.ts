import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

import { AiTacticsManager } from "./ai-tactics-manager";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";

import {
  profile,
  requireValue,
  combatActor,
  squad,
  fixtureState,
  observation,
  manager
} from "./ai-tactics-test-fixtures";

describe("AiTacticsManager", () => {
  it("H-30 advances a quiet mission through assembly, rally and advance without skipping a boundary", () => {
    const guard = combatActor("guard", "self", 1);
    const initial = fixtureState([{ ...squad("squad:attack", "attack", ["guard"]), state: "forming" }]);
    const assembled = requireValue(
      manager.propose(observation([guard], 100), initial).statePatch?.squadUpdates?.[0],
      "missing_assembled_squad_update"
    );
    const rallied = requireValue(
      manager.propose(observation([guard], 120), { ...initial, squads: [assembled] }).statePatch?.squadUpdates?.[0],
      "missing_rallied_squad_update"
    );
    const advanced = requireValue(
      manager.propose(observation([guard], 140), { ...initial, squads: [rallied] }).statePatch?.squadUpdates?.[0],
      "missing_advanced_squad_update"
    );
    expect([assembled.state, rallied.state, advanced.state]).toEqual(["assemble", "rally", "advance"]);
  });

  it("releases an armed gatherer from a tactical squad instead of interrupting its economy work", () => {
    const workerCatalog: AiCapabilityCatalogV1 = {
      schemaVersion: 1,
      generation: 1,
      unsupported: [],
      entries: [
        {
          capabilityId: "worker",
          family: "worker",
          sourceObjectName: ObjectNames.TivaraWorker,
          effectiveLevel: 1,
          movementDomains: ["ground"],
          targetDomains: ["ground"],
          produces: [],
          constructs: [ObjectNames.Olival],
          researches: [],
          gathers: [ResourceType.Wood],
          housingCapacity: null,
          housingCost: 1,
          cargoCapacity: null
        }
      ]
    };
    const workerManager = new AiTacticsManager(profile, () => workerCatalog);
    const worker = { ...combatActor("worker", "self", 1), objectName: ObjectNames.TivaraWorker };
    const current = fixtureState([squad("squad:attack", "attack", [worker.actorId])]);
    const proposal = workerManager.propose(observation([worker]), current);

    expect(proposal.statePatch?.squadUpdates?.[0]).toEqual(expect.objectContaining({ actorIds: [], state: "recover" }));
    expect(proposal.intents.some((intent) => "actorIds" in intent && intent.actorIds.includes(worker.actorId))).toBe(
      false
    );
  });

  it("FIGHT-01 keeps a quiet defense in defend and regroups an uncertain engagement", () => {
    const guard = combatActor("guard", "self", 1, "ground", 1000, { damage: 10 });
    const defended = manager.propose(
      observation([guard]),
      fixtureState([squad("squad:defense", "defense", ["guard"])])
    );
    expect(defended.statePatch?.squadUpdates?.[0]?.state).toBe("defend");

    const enemy = combatActor("enemy", "enemy", 3, "ground", 1000, { damage: 10 });
    const regrouped = manager.propose(
      observation([guard, enemy]),
      fixtureState([squad("squad:attack", "attack", ["guard"])])
    );
    expect(regrouped.statePatch?.squadUpdates?.[0]?.state).toBe("regroup");
  });

  it("keeps new reinforcements on offense when only a static enemy building is near home", () => {
    const defender = combatActor("defender", "self", 1);
    const attacker = combatActor("attacker", "self", 2);
    const reinforcement = combatActor("reinforcement", "self", 3);
    const enemyBuilding = {
      ...combatActor("enemy-building", "enemy", 5),
      housingCost: { status: "known" as const, value: 0, observedTick: 100 },
      capabilities: []
    };
    const proposal = manager.propose(
      observation([defender, attacker, reinforcement, enemyBuilding]),
      fixtureState([
        squad("squad:defense", "defense", [defender.actorId]),
        squad("squad:attack", "attack", [attacker.actorId])
      ])
    );
    const updates = proposal.statePatch?.squadUpdates ?? [];

    expect(updates.find((candidate) => candidate.squadId === "squad:defense")?.actorIds).toEqual(["defender"]);
    expect(updates.find((candidate) => candidate.squadId === "squad:attack")?.actorIds).toEqual([
      "attacker",
      "reinforcement"
    ]);
  });

  it("H-30 drains a large retreat across the actor-order quota instead of dropping the mission order", () => {
    const guards = Array.from({ length: profile.maxActorOrdersPerStep + 3 }, (_, index) =>
      combatActor(`guard-${index.toString().padStart(2, "0")}`, "self", 5, "ground", 200, { damage: 1 })
    );
    const enemy = combatActor("enemy", "enemy", 7, "ground", 1000, { damage: 100 });
    const current = fixtureState([
      squad(
        "squad:attack",
        "attack",
        guards.map((actor) => actor.actorId)
      )
    ]);
    const first = manager.propose(observation([...guards, enemy]), current);
    const firstUpdate = requireValue(first.statePatch?.squadUpdates?.[0], "missing_retreat_squad_update");
    expect(first.intents.flatMap((intent) => ("actorIds" in intent ? intent.actorIds : []))).toHaveLength(
      profile.maxActorOrdersPerStep
    );
    expect(firstUpdate.tactics?.orderedActorIds).toHaveLength(profile.maxActorOrdersPerStep);

    const second = manager.propose(observation([...guards, enemy], 120), { ...current, squads: [firstUpdate] });
    expect(second.intents.flatMap((intent) => ("actorIds" in intent ? intent.actorIds : []))).toHaveLength(3);
    expect(second.statePatch?.squadUpdates?.[0]?.tactics?.orderedActorIds).toHaveLength(guards.length);
  });

  it("H-23 gives each actor one primary owner and releases an absent straggler", () => {
    const actors = [
      combatActor("guard-a", "self", 1),
      combatActor("guard-b", "self", 2),
      combatActor("enemy", "enemy", 6)
    ];
    const proposal = manager.propose(
      observation(actors),
      fixtureState([
        squad("squad:defense", "defense", ["guard-a", "missing"]),
        squad("squad:attack", "attack", ["guard-a", "guard-b", "missing"])
      ])
    );
    const updates = proposal.statePatch?.squadUpdates ?? [];
    expect(updates.find((entry) => entry.squadId === "squad:defense")?.actorIds).toEqual(["guard-a"]);
    expect(updates.find((entry) => entry.squadId === "squad:attack")?.actorIds).toEqual(["guard-b"]);
  });

  it("H-24 releases a lost target and records observed squad casualties without resetting the mission", () => {
    const guardA = combatActor("guard-a", "self", 1);
    const guardB = combatActor("guard-b", "self", 2);
    const targetA = combatActor("target-a", "enemy", 5, "ground", 1000, { capabilityFamilies: ["produce"] });
    const targetB = combatActor("target-b", "enemy", 6);
    const current = fixtureState([squad("squad:attack", "attack", ["guard-a", "guard-b"])]);
    const first = manager.propose(observation([guardA, guardB, targetA, targetB]), current);
    const committed = requireValue(first.statePatch?.squadUpdates?.[0], "missing_casualty_squad_update");
    const second = manager.propose(observation([guardA, targetB], 120), { ...current, squads: [committed] });
    expect(second.statePatch?.squadUpdates?.[0]?.tactics).toEqual(
      expect.objectContaining({
        targetActorId: "target-b",
        observedLossCount: 1,
        lastObservedMemberCount: 1
      })
    );
  });

  it("H6 records independently observed useful effects on the owning mission", () => {
    const guard = combatActor("guard", "self", 1);
    const current = fixtureState([squad("squad:attack", "attack", ["guard"])]);
    const effectId = "effect:stage13:squad:attack:damage:guard:enemy:115";
    const applied = {
      kind: "completed",
      tick: 115,
      resultingActorIds: [],
      worldLinkIds: ["world:attack"],
      identity: {
        matchId: "match:stage13",
        authorityEpoch: 1,
        playerNumber: 1,
        sequence: 7,
        commandId: "command:stage13:7",
        effectId,
        intentId: "intent:stage13:7"
      }
    } satisfies AiBrainStateV1["pendingOutcomes"][number];
    const proposal = manager.propose(observation([guard], 120), { ...current, pendingOutcomes: [applied] });
    expect(proposal.statePatch?.squadUpdates?.[0]?.lifecycle?.lastUsefulEffectTick).toBe(115);
  });
});
