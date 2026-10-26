import { OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import { combatActor, fixtureState, squad, observation, manager } from "./ai-tactics-test-fixtures";

it("keeps a healthy native attack on the reserved target instead of restarting its windup", () => {
  const attacker = combatActor("attacker", "self", 0, "ground", 1000, { damage: 100 });
  const enemy = combatActor("enemy", "enemy", 3, "ground", 1000, { damage: 1 });
  const state = fixtureState([{ ...squad("squad:attack", "attack", [attacker.actorId]), objectiveId: enemy.actorId }]);
  const attacking = {
    ...attacker,
    activeOrder: {
      status: "known" as const,
      observedTick: 100,
      value: { orderType: OrderType.Attack, targetActorId: enemy.actorId }
    }
  };
  const retained = manager.propose(observation([attacking, enemy]), state);
  expect(retained.intents.filter((intent) => intent.kind === "attack")).toEqual([]);
  const idle = manager.propose(observation([attacker, enemy]), state);
  expect(idle.intents.filter((intent) => intent.kind === "attack")).toHaveLength(1);
});

it("keeps a scout travelling to its information destination instead of reforming around its current position", () => {
  const actor = combatActor("scout", "self", 0);
  const mission = { ...squad("squad:scout:primary", "scout", [actor.actorId]), objectiveId: "question:search:a" };
  const base = observation([actor]);
  const world = {
    ...base,
    map: {
      ...base.map!,
      scoutSearchPoints: [
        { pointId: "search:a", accessNodeId: "access:front" as const, position: { x: 12, y: 0, z: 0 }, observed: false }
      ],
      constructionCells: Array.from({ length: 18 }, (_, x) => ({
        tileKey: `${x},0`,
        position: { x, y: 0, z: 0 },
        groundPassable: true,
        waterPassable: false,
        elevation: 0,
        observedBlocked: false
      }))
    }
  };
  const state = fixtureState([mission]);
  const first = manager.propose(world, state);
  const move = first.intents.find((intent) => intent.kind === "move");
  if (move?.kind !== "move") throw new Error("scout_move_missing");
  expect(move.logicalPosition.x).toBeGreaterThan(8);
  expect(Math.abs(move.logicalPosition.x - 12)).toBeLessThanOrEqual(4);
  const updates = first.statePatch?.squadUpdates;
  if (!updates) throw new Error("scout_update_missing");
  const movingActor = {
    ...combatActor("scout", "self", 4),
    activeOrder: {
      status: "known" as const,
      value: { orderType: OrderType.Move, targetActorId: null },
      observedTick: 140
    }
  };
  const next = manager.propose({ ...world, tick: 140, actors: [movingActor] }, { ...state, squads: updates });
  expect(next.intents.filter((intent) => intent.kind === "move")).toEqual([]);
});

it("keeps a frontier scout on its information destination after an enemy becomes visible", () => {
  const actor = combatActor("scout", "self", 0);
  const enemy = combatActor("enemy", "enemy", 3);
  const mission = { ...squad("squad:scout:primary", "scout", [actor.actorId]), objectiveId: "question:search:a" };
  const base = observation([actor, enemy]);
  const world = {
    ...base,
    map: {
      ...base.map!,
      scoutSearchPoints: [
        { pointId: "search:a", accessNodeId: "access:front" as const, position: { x: 12, y: 0, z: 0 }, observed: false }
      ],
      constructionCells: Array.from({ length: 18 }, (_, x) => ({
        tileKey: `${x},0`,
        position: { x, y: 0, z: 0 },
        groundPassable: true,
        waterPassable: false,
        elevation: 0,
        observedBlocked: false
      }))
    }
  };
  const state = fixtureState([mission]);
  const proposal = manager.propose(world, state);
  const move = proposal.intents.find((intent) => intent.kind === "move");
  if (move?.kind !== "move") throw new Error("scout_move_missing");
  expect(move.logicalPosition.x).toBeGreaterThan(8);
  expect(Math.abs(move.logicalPosition.x - 12)).toBeLessThanOrEqual(4);
});
