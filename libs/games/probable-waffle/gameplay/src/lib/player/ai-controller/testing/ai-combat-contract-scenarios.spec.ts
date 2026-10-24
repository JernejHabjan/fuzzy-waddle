import { safeRetreatPosition } from "../planning/ai-tactics-geometry";
import { combatActor, squad, fixtureState, observation, manager } from "../planning/ai-tactics-test-fixtures";
import { AiTacticsManager } from "../planning/ai-tactics-manager";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";

describe("combat and scouting scenario contracts", () => {
  it("SCOUT-03 chooses a legal escape cell and returns no fabricated escape when every cell is blocked", () => {
    const scout = combatActor("scout", "self", 3);
    const state = fixtureState([squad("squad:scout", "scout", [scout.actorId])]);
    const safe = observation([scout]);
    expect(safeRetreatPosition(safe, state, [scout])).toEqual({ x: 0, y: 0, z: 0 });
    if (!safe.map) throw new Error("missing_map");
    const unsafe = {
      ...safe,
      map: {
        ...safe.map,
        constructionCells: safe.map.constructionCells?.map((cell) => ({
          ...cell,
          observedBlocked: true
        }))
      }
    };
    expect(safeRetreatPosition(unsafe, state, [scout])).toBeNull();
  });

  it("STRAT-13 keeps separate compatible fronts with distinct actors and objectives", () => {
    const a = combatActor("front-a", "self", 1, "ground", 1000, { damage: 100 });
    const b = combatActor("front-b", "self", 20, "ground", 1000, { damage: 100 });
    const enemyA = combatActor("target-a", "enemy", 3, "ground", 1000, { damage: 1 });
    const enemyB = combatActor("target-b", "enemy", 22, "ground", 1000, { damage: 1 });
    const state = fixtureState([
      { ...squad("squad:a", "attack", [a.actorId]), objectiveId: enemyA.actorId },
      { ...squad("squad:b", "attack", [b.actorId]), objectiveId: enemyB.actorId }
    ]);
    const result = manager.propose(observation([a, b, enemyA, enemyB]), state);
    const attacks = result.intents.filter((intent) => intent.kind === "attack");
    expect(attacks).toContainEqual(expect.objectContaining({ actorIds: [a.actorId], targetActorId: enemyA.actorId }));
    expect(attacks).toContainEqual(expect.objectContaining({ actorIds: [b.actorId], targetActorId: enemyB.actorId }));
    expect(new Set(attacks.flatMap((intent) => intent.actorIds)).size).toBe(2);
    expect(result.statePatch?.squadUpdates?.map((update) => update.objectiveId).sort()).toEqual([
      "target-a",
      "target-b"
    ]);
  });

  it("D-04 Easy still retreats a losing squad and retains its bounded recovery deadline", () => {
    const weak = combatActor("weak", "self", 1, "ground", 100, { damage: 1 });
    const enemy = combatActor("strong", "enemy", 3, "ground", 1000, { damage: 100 });
    const current = { ...squad("squad:weak", "attack", [weak.actorId]), objectiveId: enemy.actorId };
    const result = new AiTacticsManager(createAiProfileConfigV1(ProbableWaffleAiDifficulty.Easy)).propose(
      observation([weak, enemy]),
      fixtureState([current])
    );
    const update = result.statePatch?.squadUpdates?.find((entry) => entry.squadId === current.squadId);
    expect(update?.state).toBe("retreat");
    expect(update?.lifecycle?.effectDeadline).toEqual(current.lifecycle?.effectDeadline);
    expect(result.intents.some((intent) => intent.kind === "move" && intent.actorIds.includes(weak.actorId))).toBe(
      true
    );
  });
});
