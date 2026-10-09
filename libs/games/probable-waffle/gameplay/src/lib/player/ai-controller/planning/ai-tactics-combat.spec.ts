import { OrderType } from "@fuzzy-waddle/probable-waffle-protocol";

import { SpellType } from "../../../entity/components/combat/spell-type";

import { requireValue, combatActor, squad, fixtureState, observation, manager } from "./ai-tactics-test-fixtures";

describe("AiTacticsManager", () => {
  it("FIGHT-04 reserves expected impact and spreads fire after lethal damage is covered", () => {
    const actors = [
      combatActor("archer-a", "self", 1, "ground", 1000, { damage: 30 }),
      combatActor("archer-b", "self", 2, "ground", 1000, { damage: 30 }),
      combatActor("archer-c", "self", 3, "ground", 1000, { damage: 30 }),
      combatActor("archer-d", "self", 4, "ground", 1000, { damage: 30 }),
      combatActor("enemy-a", "enemy", 5, "ground", 50),
      combatActor("enemy-b", "enemy", 6, "ground", 50)
    ];
    const proposal = manager.propose(
      observation(actors, 200),
      fixtureState([squad("squad:attack", "attack", ["archer-a", "archer-b", "archer-c", "archer-d"])])
    );
    const reservations = proposal.statePatch?.squadUpdates?.[0]?.tactics?.damageReservations ?? [];
    expect(new Set(reservations.map((entry) => entry.targetActorId)).size).toBe(2);
    expect(reservations.every((entry) => entry.impactTick === 204)).toBe(true);
  });

  it("FIGHT-02 keeps a valid committed target until an alternative improves useful score by 20 percent", () => {
    const guard = combatActor("guard", "self", 1, "ground", 1000, { damage: 30 });
    const firstEnemies = [
      combatActor("enemy-a", "enemy", 5, "ground", 1000, { capabilityFamilies: ["produce"] }),
      combatActor("enemy-b", "enemy", 6, "ground", 1000, { capabilityFamilies: ["produce"] })
    ];
    const initialState = fixtureState([squad("squad:attack", "attack", ["guard"])]);
    const first = manager.propose(observation([guard, ...firstEnemies]), initialState);
    const committed = requireValue(first.statePatch?.squadUpdates?.[0], "missing_target_squad_update");
    const guardStillAttacking = {
      ...guard,
      activeOrder: {
        status: "known" as const,
        value: { orderType: OrderType.Attack, targetActorId: "enemy-a" },
        observedTick: 120
      }
    };
    const second = manager.propose(
      observation(
        [
          guardStillAttacking,
          combatActor("enemy-a", "enemy", 5, "ground", 1000, { capabilityFamilies: ["produce"] }),
          combatActor("enemy-b", "enemy", 4, "ground", 1000, { capabilityFamilies: ["produce"] })
        ],
        120
      ),
      { ...initialState, squads: [committed] }
    );
    expect(second.statePatch?.squadUpdates?.[0]?.tactics?.targetActorId).toBe("enemy-a");
    expect(second.intents).toHaveLength(0);
  });

  it("RAID-01/02 prioritizes an exposed economy or production objective over a generic combat contact", () => {
    const raider = combatActor("raider", "self", 1, "ground", 1000, { damage: 30 });
    const guard = combatActor("enemy-guard", "enemy", 4);
    const production = combatActor("enemy-production", "enemy", 6, "ground", 1000, {
      capabilityFamilies: ["produce", "drop_off"]
    });
    const proposal = manager.propose(
      observation([raider, guard, production]),
      fixtureState([squad("squad:raid", "attack", ["raider"])])
    );
    expect(proposal.statePatch?.squadUpdates?.[0]?.tactics?.targetActorId).toBe("enemy-production");
    expect(proposal.statePatch?.squadUpdates?.[0]?.tactics?.objectiveAlternatives[0]?.reason).toBe(
      "visible_value_route_not_recorded"
    );
  });

  it("RAID-02/FIGHT-01/H-25 retreats a losing squad and converts rapid relaunch oscillation to hold-front", () => {
    const friend = combatActor("guard", "self", 5, "ground", 200, { damage: 2 });
    const enemies = [
      combatActor("enemy-a", "enemy", 7, "ground", 1000, { damage: 30 }),
      combatActor("enemy-b", "enemy", 8, "ground", 1000, { damage: 30 })
    ];
    const initial = manager.propose(
      observation([friend, ...enemies]),
      fixtureState([squad("squad:attack", "attack", ["guard"])])
    );
    expect(initial.statePatch?.squadUpdates?.[0]).toEqual(expect.objectContaining({ state: "retreat" }));
    expect(initial.intents).toContainEqual(
      expect.objectContaining({ kind: "move", logicalPosition: { x: 0, y: 0, z: 0 } })
    );
    const retreated = requireValue(initial.statePatch?.squadUpdates?.[0], "missing_oscillation_retreat_update");
    const strongFriend = combatActor("guard", "self", 5, "ground", 1000, { damage: 100 });
    const weakEnemy = combatActor("enemy-a", "enemy", 7, "ground", 100, { damage: 1 });
    const relaunch = manager.propose(observation([strongFriend, weakEnemy], 110), {
      ...fixtureState([]),
      squads: [{ ...retreated, tactics: { ...retreated.tactics!, oscillationCount: 1 } }]
    });
    expect(relaunch.statePatch?.squadUpdates?.[0]).toEqual(
      expect.objectContaining({
        state: "regroup",
        tactics: expect.objectContaining({ script: "hold_front", oscillationCount: 2 })
      })
    );
    expect(relaunch.intents.some((intent) => intent.kind === "attack")).toBe(false);
  });

  it("FIGHT-04 coordinates capped healing and manual spells while leaving autocast-owned spells alone", () => {
    const wounded = combatActor("wounded", "self", 2, "ground", 500);
    const healer = combatActor("healer", "self", 1, "ground", 1000, { heal: 80, spell: true, autocast: false });
    const enemy = combatActor("enemy", "enemy", 5);
    const proposal = manager.propose(
      observation([healer, wounded, enemy]),
      fixtureState([squad("squad:defense", "defense", ["healer", "wounded"])])
    );
    expect(proposal.intents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "heal", targetActorId: "wounded" }),
        expect.objectContaining({ kind: "cast", spellType: SpellType.Firestorm })
      ])
    );
    expect(proposal.statePatch?.support).toEqual(
      expect.arrayContaining([expect.objectContaining({ usefulCapacity: 50, reason: "bounded_missing_health" })])
    );

    const autocastHealer = combatActor("healer", "self", 1, "ground", 1000, { heal: 80, spell: true, autocast: true });
    const autocast = manager.propose(
      observation([autocastHealer, wounded, enemy]),
      fixtureState([squad("squad:defense", "defense", ["healer", "wounded"])])
    );
    expect(autocast.intents.some((intent) => intent.kind === "cast")).toBe(false);
  });

  it("DOMAIN-06 keeps domain-capable interceptors and does not count a ground-only weapon against air", () => {
    const groundOnly = combatActor("ground", "self", 1, "ground", 1000, { targetDomains: ["ground"] });
    const interceptor = combatActor("interceptor", "self", 2, "ground", 1000, { targetDomains: ["air"] });
    const airEnemy = combatActor("flyer", "enemy", 5, "air");
    const proposal = manager.propose(
      observation([groundOnly, interceptor, airEnemy], 200),
      fixtureState([squad("squad:defense", "defense", ["ground", "interceptor"])])
    );
    expect(proposal.statePatch?.squadUpdates?.[0]?.tactics?.script).toBe("intercept_air_transport");
    expect(proposal.statePatch?.squadUpdates?.[0]?.tactics?.damageReservations.map((entry) => entry.actorId)).toEqual([
      "interceptor"
    ]);
  });

  it("DOMAIN-06 separates naval and air members into domain squads with one owner each", () => {
    const ship = combatActor("ship", "self", 1, "water");
    const flyer = combatActor("flyer", "self", 2, "air");
    const enemy = combatActor("enemy", "enemy", 5, "water");
    const proposal = manager.propose(
      observation([ship, flyer, enemy]),
      fixtureState([squad("squad:mixed", "attack", ["ship", "flyer"])])
    );
    const updates = proposal.statePatch?.squadUpdates ?? [];
    expect(updates.map((entry) => entry.domain).sort()).toEqual(["air", "water"]);
    expect(updates.flatMap((entry) => entry.actorIds).sort()).toEqual(["flyer", "ship"]);
  });
});
