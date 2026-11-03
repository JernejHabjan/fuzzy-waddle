import type { AiObservedActor } from "../../../contracts/observation/ai-observation";
import {
  combatActor,
  fixtureState,
  manager,
  observation,
  requireValue,
  squad
} from "../../../testing/fixtures/tactics/ai-tactics-test-fixtures";

function quietFixture(melee = false) {
  const members = [combatActor("guard-b", "self", 0), combatActor("guard-c", "self", 1)].map((actor) => {
    if (!melee || actor.combatProfile?.status !== "known") return actor;
    return {
      ...actor,
      combatProfile: {
        ...actor.combatProfile,
        value: {
          ...actor.combatProfile.value,
          attacks: actor.combatProfile.value.attacks.map((attack) => ({ ...attack, minRange: 0 }))
        }
      }
    };
  });
  const initial = fixtureState([
    {
      ...squad(
        "squad:reserve",
        "reserve",
        members.map((actor) => actor.actorId)
      ),
      state: "reserve"
    }
  ]);
  const cells = Array.from({ length: 41 }, (_, x) =>
    Array.from({ length: 41 }, (_, y) => ({
      tileKey: `${x - 10},${y - 10}`,
      position: { x: x - 10, y: y - 10, z: 0 },
      groundPassable: true,
      waterPassable: false,
      elevation: 0,
      observedBlocked: false
    }))
  ).flat();
  const observe = (actors: readonly AiObservedActor[], tick: number) => {
    const base = observation(actors, tick);
    return { ...base, map: { ...base.map!, constructionCells: cells } };
  };
  const first = requireValue(
    manager.propose(observe(members, 100), initial).statePatch?.squadUpdates?.[0],
    "missing_reserve"
  );
  const assignments = requireValue(first.tactics?.assignedPositions, "missing_positions");
  const arrived = members.map((member) => ({
    ...member,
    logicalPosition: {
      status: "known" as const,
      observedTick: 140,
      value: requireValue(
        assignments.find((entry) => entry.actorId === member.actorId),
        "missing_slot"
      ).position
    }
  }));
  return { members, initial, observe, first, assignments, arrived };
}

it("keeps quiet formation ownership after arrival reverses the members' spatial ordering", () => {
  const f = quietFixture();
  let current = f.first;
  for (const tick of [140, 180, 220]) {
    const proposal = manager.propose(f.observe(f.arrived, tick), { ...f.initial, squads: [current] });
    current = requireValue(proposal.statePatch?.squadUpdates?.[0], "missing_retained_reserve");
    expect(current.tactics?.assignedPositions).toEqual(expect.arrayContaining(f.assignments));
    expect(proposal.intents.filter((intent) => intent.kind === "move")).toEqual([]);
  }
});

it("gives an incoming reinforcement a free slot without reassigning settled members", () => {
  const f = quietFixture();
  const reinforcement = combatActor("guard-a", "self", -2);
  const proposal = manager.propose(f.observe([...f.arrived, reinforcement], 140), { ...f.initial, squads: [f.first] });
  const updated = requireValue(proposal.statePatch?.squadUpdates?.[0], "missing_reinforced_reserve");
  expect(updated.tactics?.assignedPositions).toEqual(expect.arrayContaining(f.assignments));
  expect(updated.tactics?.assignedPositions).toHaveLength(3);
  expect(proposal.intents.flatMap((intent) => (intent.kind === "move" ? intent.actorIds : []))).toEqual([
    reinforcement.actorId
  ]);
});

it("releases a blocked settled slot while retaining its neighbor's legal slot", () => {
  const f = quietFixture();
  const bad = requireValue(
    f.assignments.find((entry) => entry.actorId === "guard-b"),
    "missing_bad_slot"
  );
  const base = f.observe(f.arrived, 140);
  const blocked = {
    ...base,
    map: {
      ...base.map,
      constructionCells: base.map.constructionCells.map((cell) => ({
        ...cell,
        observedBlocked: cell.position.x === bad.position.x && cell.position.y === bad.position.y
      }))
    }
  };
  const proposal = manager.propose(blocked, { ...f.initial, squads: [f.first] });
  const positions = proposal.statePatch?.squadUpdates?.[0]?.tactics?.assignedPositions ?? [];
  expect(positions).not.toContainEqual(bad);
  expect(positions).toContainEqual(f.assignments.find((entry) => entry.actorId === "guard-c"));
  expect(new Set(positions.map((entry) => `${entry.position.x},${entry.position.y}`)).size).toBe(positions.length);
  expect(proposal.intents.flatMap((intent) => (intent.kind === "move" ? intent.actorIds : []))).toEqual([bad.actorId]);
});

it("does not pin old slots when the reserve anchor changes", () => {
  const f = quietFixture();
  const state = {
    ...f.initial,
    squads: [f.first],
    bases: f.initial.bases.map((base) => ({ ...base, anchorPosition: { x: 20, y: 0, z: 0 } }))
  };
  const proposal = manager.propose(f.observe(f.arrived, 140), state);
  const positions = proposal.statePatch?.squadUpdates?.[0]?.tactics?.assignedPositions ?? [];
  expect(positions).toHaveLength(2);
  expect(positions.every((entry) => entry.position.x >= 17)).toBe(true);
  expect(proposal.intents.flatMap((intent) => (intent.kind === "move" ? intent.actorIds : []))).toHaveLength(2);
});

it("allows a visible threat to preempt a settled reserve with combat orders", () => {
  const f = quietFixture();
  const enemy = combatActor("intruder", "enemy", 5, "ground", 1000, { damage: 1 });
  const proposal = manager.propose(f.observe([...f.arrived, enemy], 140), { ...f.initial, squads: [f.first] });
  expect(proposal.statePatch?.squadUpdates?.[0]?.state).toBe("engage");
  expect(proposal.intents).toContainEqual(expect.objectContaining({ kind: "attack", targetActorId: enemy.actorId }));
});

it("keeps settled melee slots when a ranged reinforcement changes the quiet formation's script and spacing", () => {
  const f = quietFixture(true);
  const reinforcement = combatActor("archer", "self", -2);
  const proposal = manager.propose(f.observe([...f.arrived, reinforcement], 140), { ...f.initial, squads: [f.first] });
  const updated = requireValue(proposal.statePatch?.squadUpdates?.[0], "missing_mixed_reserve");
  expect(updated.tactics?.assignedPositions).toEqual(expect.arrayContaining(f.assignments));
  expect(proposal.intents.flatMap((intent) => (intent.kind === "move" ? intent.actorIds : []))).toEqual([
    reinforcement.actorId
  ]);
});
