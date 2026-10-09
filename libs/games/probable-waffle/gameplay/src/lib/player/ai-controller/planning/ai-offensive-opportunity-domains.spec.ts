import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";

import { buildAiAccessGraphV1 } from "./ai-access-graph-v1";

import { guard, core, world, brain, manager } from "./ai-offensive-opportunity-test-fixtures";

describe("fastest credible offense", () => {
  it("does not count shoreline ground troops as a naval force against a water objective", () => {
    const waterAccess = buildAiAccessGraphV1({
      generation: 1,
      staticRevision: 1,
      dynamicRevision: 1,
      threatRevision: 0,
      builtTick: 0,
      continuationCursor: 0,
      includeAirRegion: true,
      cells: [
        {
          x: 0,
          y: 0,
          ground: true,
          water: false,
          elevation: 0,
          groundNeighborKeys: [],
          knowledge: "known_static",
          clearance: 2
        },
        {
          x: 1,
          y: 0,
          ground: false,
          water: true,
          elevation: 0,
          groundNeighborKeys: [],
          knowledge: "known_static",
          clearance: 2
        }
      ]
    });
    const shore = waterAccess.groundNodeByTileKey.get("0,0")!;
    const water = waterAccess.waterNodeByTileKey.get("1,0")!;
    const attacker = {
      ...guard("guard", "self", 0),
      accessNodeId: { status: "known" as const, value: shore, observedTick: 20 },
      capabilities: [
        {
          id: "guard:shore-weapon",
          family: "military",
          level: 1,
          domains: ["ground" as const],
          targetDomains: ["water" as const],
          capacity: { status: "known" as const, value: 0, observedTick: 20 }
        }
      ]
    };
    const boat = {
      ...guard("boat", "enemy", 1),
      housingCost: { status: "known" as const, value: 0, observedTick: 20 },
      accessNodeId: { status: "known" as const, value: water, observedTick: 20 },
      capabilities: [
        {
          id: "boat:water",
          family: "transport",
          level: 1,
          domains: ["water" as const],
          targetDomains: [],
          capacity: { status: "known" as const, value: 0, observedTick: 20 }
        }
      ]
    };
    const observation = world([attacker, boat]);
    const result = manager.propose(
      { ...observation, map: { ...observation.map!, accessGraph: waterAccess.graph } },
      brain()
    );

    expect(result.statePatch?.strategy?.assessment?.choice).toBe("scout");
    expect(result.intents.some((intent) => intent.kind === "attack")).toBe(false);
  });

  it("finds an air route to an observed core when the land regions are disconnected", () => {
    const separated = buildAiAccessGraphV1({
      generation: 1,
      staticRevision: 1,
      dynamicRevision: 1,
      threatRevision: 0,
      builtTick: 0,
      continuationCursor: 0,
      includeAirRegion: true,
      cells: [
        {
          x: 0,
          y: 0,
          ground: true,
          water: false,
          elevation: 0,
          groundNeighborKeys: [],
          knowledge: "known_static",
          clearance: 2
        },
        {
          x: 2,
          y: 0,
          ground: true,
          water: false,
          elevation: 0,
          groundNeighborKeys: [],
          knowledge: "known_static",
          clearance: 2
        }
      ]
    });
    const ownGround = separated.groundNodeByTileKey.get("0,0")!;
    const enemyGround = separated.groundNodeByTileKey.get("2,0")!;
    const ground = {
      ...guard("ground", "self", 0),
      accessNodeId: { status: "known" as const, value: ownGround, observedTick: 20 }
    };
    const air = {
      ...guard("owl", "self", 0),
      accessNodeId: { status: "known" as const, value: separated.airNodeId!, observedTick: 20 },
      capabilities: [
        {
          id: "owl:air",
          family: "military",
          level: 1,
          domains: ["air" as const],
          targetDomains: ["ground" as const],
          capacity: { status: "known" as const, value: 0, observedTick: 20 }
        }
      ]
    };
    const enemy = {
      ...core("enemy-core"),
      accessNodeId: { status: "known" as const, value: enemyGround, observedTick: 20 }
    };
    const observation = world([ground, air, enemy]);
    const result = manager.propose(
      { ...observation, map: { ...observation.map!, accessGraph: separated.graph } },
      brain()
    );

    expect(result.statePatch?.strategy?.assessment).toEqual(
      expect.objectContaining({ targetActorId: "enemy-core", routeDomain: "air", readyForce: 1 })
    );
    expect(result.statePatch?.squads?.find((squad) => squad.role === "attack")?.actorIds).toEqual(["owl"]);
  });

  it("assembles against a visible counterforce and retains a reason instead of sending a token attack", () => {
    const enemies = [core("enemy-core"), ...[1, 2, 3, 4].map((index) => guard(`defender-${index}`, "enemy", 1))];
    const result = manager.propose(world([guard("a", "self", 0), guard("b", "self", 0), ...enemies]), brain());

    expect(result.statePatch?.skirmish?.timeline.some((event) => event.detail.startsWith("launch:"))).toBe(false);
    expect(result.statePatch?.squads?.find((squad) => squad.role === "attack")?.state).toBe("forming");
    expect(result.statePatch?.strategy?.assessment?.reason).toBe("assembling_compatible_force");
  });

  it("keeps assembling when a severe observed counterforce outlasts the assembly deadline", () => {
    const enemies = [core("enemy-core"), ...[1, 2, 3, 4].map((index) => guard(`defender-${index}`, "enemy", 1))];
    const initial = brain();
    const first = manager.propose(world([guard("a", "self", 0), guard("b", "self", 0), ...enemies]), initial);
    const state: AiBrainStateV1 = {
      ...initial,
      squads: first.statePatch!.squads!,
      skirmish: first.statePatch!.skirmish!
    };

    const later = manager.propose(world([guard("a", "self", 0), guard("b", "self", 0), ...enemies], 1300), state);
    expect(later.statePatch?.squads?.find((squad) => squad.role === "attack")?.state).toBe("forming");
    expect(later.statePatch?.skirmish?.timeline.some((event) => event.detail.startsWith("launch:"))).toBe(false);
  });
});
