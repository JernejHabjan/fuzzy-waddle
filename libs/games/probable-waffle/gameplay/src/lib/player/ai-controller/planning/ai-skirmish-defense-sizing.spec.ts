import { FactionType, ObjectNames, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservedActorV1 } from "../contracts/ai-observation-v1";
import type { AiSkirmishProposalContext } from "./ai-skirmish-proposal-context";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { advanceAiSkirmishDefense } from "./ai-skirmish-defense";
import { createAiSkirmishProposalContext } from "./ai-skirmish-proposal-draft";

const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
const catalog: AiCapabilityCatalogV1 = { schemaVersion: 1, generation: 1, entries: [], unsupported: [] };

function combatant(
  id: string,
  relation: "self" | "enemy",
  x: number,
  visibleEnemyActorIds?: AiObservedActorV1["visibleEnemyActorIds"]
): AiObservedActorV1 {
  return {
    ...createAiTestOwnedActor(id),
    objectName: ObjectNames.TivaraMacemanMale,
    owner: relation === "self" ? 1 : 2,
    relation,
    visibility: relation === "self" ? "owned" : "visible",
    ...(visibleEnemyActorIds ? { visibleEnemyActorIds } : {}),
    logicalPosition: { status: "known", value: { x, y: 0, z: 0 }, observedTick: 20 },
    capabilities: [
      {
        id: `${id}:attack`,
        family: "attack",
        level: 1,
        domains: ["ground"],
        targetDomains: ["ground"],
        capacity: { status: "known", value: 0, observedTick: 20 }
      }
    ],
    housingCost: { status: "known", value: 1, observedTick: 20 }
  };
}

function defenseContextFor(
  raiderCount: number,
  distantFirstDefender = false,
  exactEmptyVision = false
): AiSkirmishProposalContext {
  const home: AiObservedActorV1 = {
    ...createAiTestOwnedActor("main"),
    objectName: ObjectNames.Sandhold,
    mainBuilding: { status: "known", value: true, observedTick: 20 },
    housingCost: { status: "known", value: 0, observedTick: 20 },
    logicalPosition: { status: "known", value: { x: 0, y: 0, z: 0 }, observedTick: 20 }
  };
  const defenders = Array.from({ length: 8 }, (_, index) =>
    combatant(`guard-${index}`, "self", distantFirstDefender && index === 0 ? 20 : 1, exactEmptyVision ? [] : undefined)
  );
  const raiders = Array.from({ length: raiderCount }, (_, index) => combatant(`raider-${index}`, "enemy", 3 + index));
  const observation = { ...createAiTestObservation(), actors: [home, ...defenders, ...raiders] };
  const state = createAiBrainStateV1({
    playerNumber: 1,
    faction: FactionType.Tivara,
    profile,
    tick: 0,
    archetypeId: "balanced"
  });
  const context = createAiSkirmishProposalContext(observation, state, catalog);
  advanceAiSkirmishDefense(context, profile);
  return context;
}

function defendersFor(raiderCount: number): number {
  const context = defenseContextFor(raiderCount);
  return context.nextSquads.find((squad) => squad.role === "defense")?.actorIds.length ?? 0;
}

describe("AI local defense sizing", () => {
  it("uses a bounded pair of defenders against one mobile home raider", () => {
    expect(defendersFor(1)).toBe(2);
  });

  it("scales defense to visible multi-unit home pressure instead of recalling only a quarter of the army", () => {
    expect(defendersFor(3)).toBe(6);
  });

  it("claims every defender so a retreat order cannot overlap the attack command", () => {
    const context = defenseContextFor(1);
    const attack = context.intents.find((intent) => intent.kind === "attack");

    expect(attack?.kind).toBe("attack");
    if (attack?.kind !== "attack") return;
    expect(attack.claims).toEqual(
      attack.actorIds.map((actorId) => ({
        claimId: `claim:stage9:actor:${actorId}`,
        kind: "actor",
        actorId
      }))
    );
  });

  it("moves defenders toward a visible threat when they are outside their own vision range", () => {
    const context = defenseContextFor(1, true);
    const attack = context.intents.find((intent) => intent.kind === "attack");
    const intercept = context.intents.find((intent) => intent.kind === "move");

    expect(attack && "actorIds" in attack ? attack.actorIds : []).toEqual(["guard-1"]);
    expect(intercept && "actorIds" in intercept ? intercept.actorIds : []).toEqual(["guard-0"]);
  });

  it("does not attack a player-visible threat absent from each defender's native vision", () => {
    const context = defenseContextFor(1, false, true);

    expect(context.intents.some((intent) => intent.kind === "attack")).toBe(false);
    expect(context.intents).toContainEqual(expect.objectContaining({ kind: "move", actorIds: ["guard-0", "guard-1"] }));
  });
});
