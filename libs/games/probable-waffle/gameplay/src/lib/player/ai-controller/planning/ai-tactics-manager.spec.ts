import {
  FactionType,
  ObjectNames,
  OrderType,
  ProbableWaffleAiDifficulty,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { SpellType } from "../../../entity/components/combat/spell-type";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import { aiDeadline } from "../contracts/ai-core-types";
import type { AiBrainStateV1, AiSquadStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiDomainV1, AiObservedActorV1, AiObservationV1 } from "../contracts/ai-observation-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { AiTacticsManager } from "./ai-tactics-manager";

const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);

function requireValue<T>(value: T | undefined, reason: string): T {
  if (value === undefined) throw new Error(reason);
  return value;
}

function combatActor(
  actorId: string,
  relation: "self" | "enemy",
  x: number,
  domain: AiDomainV1 = "ground",
  healthPermille = 1000,
  options: {
    readonly damage?: number;
    readonly heal?: number;
    readonly spell?: boolean;
    readonly autocast?: boolean;
    readonly targetDomains?: readonly AiDomainV1[];
    readonly capabilityFamilies?: readonly string[];
    readonly mainBuilding?: boolean;
  } = {}
): AiObservedActorV1 {
  const damage = options.damage ?? 10;
  return {
    ...createAiTestOwnedActor(actorId),
    objectName: ObjectNames.TivaraMacemanMale,
    owner: relation === "self" ? 1 : 2,
    relation,
    visibility: relation === "self" ? "owned" : "visible",
    logicalPosition: { status: "known", value: { x, y: 0, z: 0 }, observedTick: 100 },
    capabilities: ["attack", ...(options.capabilityFamilies ?? [])].map((family) => ({
      id: `${actorId}:${family}`,
      family,
      level: 1,
      domains: [domain],
      targetDomains: ["ground", "water", "air"],
      capacity: { status: "known" as const, value: 0, observedTick: 100 }
    })),
    healthPermille: { status: "known", value: healthPermille, observedTick: 100 },
    combatProfile: {
      status: "known",
      observedTick: 100,
      value: {
        maxHealth: 100,
        maxArmour: 20,
        armourPermille: 1000,
        passiveRegenerationPerSecond: 0,
        attacks: [
          {
            damage,
            cooldownTicks: 20,
            range: 5,
            minRange: 2,
            highGroundRangeBonus: 1,
            impactDelayTicks: 4,
            areaRadius: 0,
            targetDomains: options.targetDomains ?? ["ground", "water", "air"]
          }
        ],
        healing: options.heal ? { amount: options.heal, cooldownTicks: 20, remainingCooldownTicks: 0, range: 5 } : null,
        spells: options.spell
          ? [
              {
                spellType: SpellType.Firestorm,
                ready: true,
                researched: true,
                autocast: options.autocast ?? false,
                range: 8,
                areaRadius: 3,
                targetAllies: false,
                targetEnemies: true,
                targetSelf: false,
                targetDomains: ["ground"],
                instantDamage: 5,
                periodicDamage: 25,
                instantHeal: 0,
                periodicHeal: 0,
                stunTicks: 0,
                slowTicks: 0,
                zoneDurationTicks: 100,
                summons: false,
                summonDurationTicks: null
              }
            ]
          : [],
        statuses: []
      }
    },
    ...(options.mainBuilding ? { mainBuilding: { status: "known" as const, value: true, observedTick: 100 } } : {}),
    containedInActorId: null
  };
}

function squad(squadId: string, role: AiSquadStateV1["role"], actorIds: readonly string[]): AiSquadStateV1 {
  return {
    squadId: squadId as AiSquadStateV1["squadId"],
    role,
    domain: "ground",
    actorIds,
    objectiveId: null,
    state: "ready",
    lifecycle: {
      targetPlayerNumber: 2,
      targetRegionId: "access:front",
      protectedBaseId: role === "defense" ? "base:home" : null,
      rallyNodeId: "access:home",
      retreatNodeId: "access:home",
      createdTick: 0,
      assemblyDeadline: aiDeadline(200),
      effectDeadline: aiDeadline(1200),
      lastUsefulEffectTick: null,
      recoveryAttempt: 0,
      terminalReason: null
    }
  };
}

function fixtureState(squads: readonly AiSquadStateV1[]): AiBrainStateV1 {
  const state = createAiBrainStateV1({
    playerNumber: 1,
    faction: FactionType.Tivara,
    profile,
    tick: 0,
    archetypeId: "balanced"
  });
  return {
    ...state,
    bases: [
      {
        baseId: "base:home",
        anchorActorId: "main",
        memberActorIds: [],
        active: true,
        anchorPosition: { x: 0, y: 0, z: 0 }
      }
    ],
    squads
  };
}

function observation(actors: readonly AiObservedActorV1[], tick = 100): AiObservationV1 {
  return {
    ...createAiTestObservation(),
    tick,
    actors,
    map: {
      bounds: { status: "known", value: { width: 32, height: 32 }, observedTick: tick },
      staticRevision: 1,
      frontierAccessNodeIds: [],
      scoutCoverageAccessNodeIds: [],
      dynamicObstacleActorIds: [],
      regionGeneration: { generation: 1, status: "ready", continuationCursor: 0 },
      constructionCells: [
        {
          tileKey: "0,0",
          position: { x: 0, y: 0, z: 0 },
          groundPassable: true,
          waterPassable: true,
          elevation: 0,
          observedBlocked: false
        }
      ]
    },
    threatSummary: {
      observedTick: tick,
      visibleEnemyActorIds: actors.filter((actor) => actor.relation === "enemy").map((actor) => actor.actorId),
      rememberedEnemyActorIds: [],
      observedCapabilityFamilies: ["attack"]
    }
  };
}

describe("AiTacticsManager", () => {
  const manager = new AiTacticsManager(profile);

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
    } as AiBrainStateV1["pendingOutcomes"][number];
    const proposal = manager.propose(observation([guard], 120), { ...current, pendingOutcomes: [applied] });
    expect(proposal.statePatch?.squadUpdates?.[0]?.lifecycle?.lastUsefulEffectTick).toBe(115);
  });

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

  it("H-29 leaves passengers under transport authority until the explicit squad handoff", () => {
    const guard = combatActor("guard", "self", 1);
    const current = fixtureState([squad("squad:landing", "attack", ["guard"])]);
    const transport = {
      planId: "transport:landing",
      phase: "transit",
      passengerIds: ["guard"],
      transportIds: ["carrier"],
      queryIds: ["query:landing"]
    } as AiBrainStateV1["transport"][number];
    const inTransit = manager.propose(observation([guard]), { ...current, transport: [transport] });
    expect(inTransit.statePatch?.squadUpdates?.[0]).toEqual(
      expect.objectContaining({ actorIds: [], state: "recover" })
    );

    const handedOff = manager.propose(observation([guard], 120), {
      ...current,
      transport: [{ ...transport, phase: "handoff" }]
    });
    expect(handedOff.statePatch?.squadUpdates?.[0]).toEqual(
      expect.objectContaining({
        actorIds: ["guard"],
        state: "regroup",
        tactics: expect.objectContaining({ script: "land_regroup" })
      })
    );
  });

  it("C-06 makes a bounded decision at the assembly deadline and recovers at the effect deadline", () => {
    const friend = combatActor("guard", "self", 1, "ground", 1000, { damage: 10 });
    const enemy = combatActor("enemy", "enemy", 3, "ground", 1000, { damage: 10 });
    const current = fixtureState([squad("squad:attack", "attack", ["guard"])]);
    const launch = manager.propose(observation([friend, enemy], 200), current);
    expect(launch.statePatch?.squadUpdates?.[0]?.state).toBe("engage");
    const committed = requireValue(launch.statePatch?.squadUpdates?.[0], "missing_deadline_launch_update");
    const expired = manager.propose(observation([friend, enemy], 1200), { ...current, squads: [committed] });
    expect(expired.statePatch?.squadUpdates?.[0]?.state).toBe("recover");
    expect(expired.statePatch?.squadUpdates?.[0]?.lifecycle).toEqual(
      expect.objectContaining({
        recoveryAttempt: 1,
        terminalReason: "effect_deadline_recovery"
      })
    );
    const recovered = requireValue(expired.statePatch?.squadUpdates?.[0], "missing_deadline_recovery_update");
    const exhausted = manager.propose(observation([friend, enemy], 3600), { ...current, squads: [recovered] });
    expect(exhausted.statePatch?.squadUpdates?.[0]).toEqual(
      expect.objectContaining({
        actorIds: [],
        state: "completed",
        lifecycle: expect.objectContaining({ terminalReason: "effect_deadline_exhausted" })
      })
    );
  });

  it("extends a mission deadline when a completed damage effect proves progress", () => {
    const friend = combatActor("guard", "self", 1, "ground", 1000, { damage: 10 });
    const currentSquad = squad("squad:attack", "attack", [friend.actorId]);
    const current = fixtureState([currentSquad]);
    const progressed = manager.propose(observation([friend], 1200), {
      ...current,
      pendingOutcomes: [
        {
          identity: {
            commandId: "command:progress",
            intentId: "intent:progress",
            effectId: "effect:stage13:squad:attack:damage:guard:enemy:1100"
          },
          kind: "completed",
          tick: 1100,
          reason: null
        }
      ]
    });

    expect(progressed.statePatch?.squadUpdates?.[0]).toEqual(
      expect.objectContaining({
        state: "advance",
        lifecycle: expect.objectContaining({
          lastUsefulEffectTick: 1100,
          effectDeadline: expect.objectContaining({ dueTick: 3600 }),
          recoveryAttempt: 0,
          terminalReason: null
        })
      })
    );
  });

  it("does not treat a movement acknowledgement as useful mission progress", () => {
    const friend = combatActor("guard", "self", 1, "ground", 1000, { damage: 10 });
    const currentSquad = squad("squad:attack", "attack", [friend.actorId]);
    const current = fixtureState([currentSquad]);
    const proposal = manager.propose(observation([friend], 1200), {
      ...current,
      pendingOutcomes: [
        {
          identity: {
            commandId: "command:movement",
            intentId: "intent:movement",
            effectId: "effect:stage13:squad:attack:position:guard:1100"
          },
          kind: "completed",
          tick: 1100,
          reason: null
        }
      ]
    });

    expect(proposal.statePatch?.squadUpdates?.[0]).toEqual(
      expect.objectContaining({
        state: "recover",
        lifecycle: expect.objectContaining({
          lastUsefulEffectTick: null,
          recoveryAttempt: 1,
          terminalReason: "effect_deadline_recovery"
        })
      })
    );
  });

  it("moves toward a player-visible target until the member has local vision to attack", () => {
    const friend = combatActor("guard", "self", 1, "ground", 1000, { damage: 10 });
    const enemy = combatActor("enemy", "enemy", 20, "ground", 1000, { damage: 10 });
    const current = fixtureState([squad("squad:attack", "attack", [friend.actorId])]);

    const proposal = manager.propose(observation([friend, enemy], 200), current);

    expect(proposal.intents.some((intent) => intent.kind === "attack")).toBe(false);
    expect(proposal.intents).toContainEqual(expect.objectContaining({ kind: "move", actorIds: [friend.actorId] }));
  });

  it("continues advancing toward a remembered objective while it is outside current vision", () => {
    const friend = combatActor("guard", "self", 1, "ground", 1000, { damage: 10 });
    const rememberedEnemy = {
      ...combatActor("enemy", "enemy", 8, "ground", 1000, { damage: 10 }),
      visibility: "last_seen" as const
    };
    const attack = { ...squad("squad:attack", "attack", [friend.actorId]), objectiveId: rememberedEnemy.actorId };

    const proposal = manager.propose(observation([friend, rememberedEnemy], 300), fixtureState([attack]));

    expect(proposal.statePatch?.squadUpdates?.[0]).toEqual(
      expect.objectContaining({ state: "advance", objectiveId: rememberedEnemy.actorId })
    );
    expect(proposal.intents).toContainEqual(expect.objectContaining({ kind: "move" }));
    expect(proposal.intents.some((intent) => intent.kind === "attack")).toBe(false);
  });

  it("releases a mission whose last-known objective has remained stale past its pursuit bound", () => {
    const friend = combatActor("guard", "self", 1, "ground", 1000, { damage: 10 });
    const staleEnemy = {
      ...combatActor("enemy", "enemy", 8, "ground", 1000, { damage: 10 }),
      visibility: "last_seen" as const,
      observedTick: 1400,
      logicalPosition: { status: "known" as const, value: { x: 8, y: 0, z: 0 }, observedTick: 100 }
    };
    const attack = { ...squad("squad:attack", "attack", [friend.actorId]), objectiveId: staleEnemy.actorId };

    const proposal = manager.propose(observation([friend, staleEnemy], 1400), fixtureState([attack]));

    expect(proposal.statePatch?.squadUpdates?.[0]).toEqual(
      expect.objectContaining({
        actorIds: [],
        state: "completed",
        lifecycle: expect.objectContaining({ terminalReason: "stale_contact_released" })
      })
    );
    expect(proposal.intents).toEqual([]);
  });

  it("releases a mission after its concrete objective disappears from permitted observation", () => {
    const friend = combatActor("guard", "self", 1, "ground", 1000, { damage: 10 });
    const attack = { ...squad("squad:attack", "attack", [friend.actorId]), objectiveId: "missing-enemy" };

    const proposal = manager.propose(observation([friend], 1400), fixtureState([attack]));

    expect(proposal.statePatch?.squadUpdates?.[0]).toEqual(
      expect.objectContaining({ actorIds: [], state: "completed" })
    );
    expect(proposal.intents).toEqual([]);
  });

  it("WALL-03 assigns reachable rampart posts while retaining a mobile reserve", () => {
    const defenders = [0, 1, 2, 3].map((index) => combatActor(`guard-${index}`, "self", index));
    const enemy = combatActor("enemy", "enemy", 6);
    const current = fixtureState([
      squad(
        "squad:defense",
        "defense",
        defenders.map((actor) => actor.actorId)
      )
    ]);
    const fortified: AiBrainStateV1 = {
      ...current,
      fortifications: [
        {
          planId: "fortification:home",
          nodeIds: ["post:1"],
          completedNodeIds: ["post:1"],
          protectedBaseIds: ["base:home"],
          lifecycle: "active",
          graph: {
            baseId: "base:home",
            createdTick: 0,
            terrainAnchorTileKeys: ["0,0", "2,0"],
            openingNodeId: "opening",
            protectedAssetIds: ["main"],
            wholeConnectivity: "preserved",
            incrementalConnectivity: "preserved",
            budget: { spendPermille: 100, committedByResource: {}, remainingByResource: {} },
            nodes: [
              {
                nodeId: "post:1",
                kind: "tower",
                objectName: null,
                position: { x: 0, y: 0, z: 1 },
                footprintTileKeys: ["0,0"],
                navigation: null,
                componentId: "front",
                dependsOnNodeId: null,
                lifecycle: "finished",
                completedActorId: null,
                attempt: 0,
                effectId: null,
                retryAfterTick: 0,
                marginalCoverage: 10,
                targetDomains: ["ground"],
                defenderPostReachable: true
              }
            ],
            constructionSequenceNodeIds: ["post:1"],
            defenderPosts: [{ nodeId: "post:1", assignedActorIds: [], reachable: true }],
            breach: { missingNodeIds: [], reason: null, risk: "none", responseEffectId: null, recoveryAttempts: 0 }
          }
        }
      ]
    };
    const proposal = manager.propose(observation([...defenders, enemy]), fortified);
    const tactics = proposal.statePatch?.squadUpdates?.[0]?.tactics;
    expect(tactics).toEqual(expect.objectContaining({ script: "rampart_defend", mobileReserveActorIds: ["guard-3"] }));
    expect(
      tactics?.assignedPositions.some((assignment) => tactics.mobileReserveActorIds.includes(assignment.actorId))
    ).toBe(false);

    const breached = manager.propose(observation([...defenders, enemy], 120), {
      ...fortified,
      fortifications: fortified.fortifications.map((plan) => ({
        ...plan,
        graph: plan.graph ? { ...plan.graph, breach: { ...plan.graph.breach, missingNodeIds: ["post:2"] } } : plan.graph
      }))
    });
    expect(breached.statePatch?.squadUpdates?.[0]?.tactics?.script).toBe("rampart_reinforce");

    const topologyLost = manager.propose(observation([...defenders, enemy], 140), {
      ...fortified,
      fortifications: fortified.fortifications.map((plan) => ({
        ...plan,
        graph: plan.graph
          ? {
              ...plan.graph,
              defenderPosts: plan.graph.defenderPosts.map((post) => ({ ...post, reachable: false }))
            }
          : plan.graph
      }))
    });
    expect(topologyLost.statePatch?.squadUpdates?.[0]).toEqual(
      expect.objectContaining({
        state: "retreat",
        tactics: expect.objectContaining({ script: "rampart_withdraw" })
      })
    );
  });
});
