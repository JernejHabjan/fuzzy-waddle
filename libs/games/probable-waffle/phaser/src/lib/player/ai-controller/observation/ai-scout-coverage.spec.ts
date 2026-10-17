import type Phaser from "phaser";
import { buildAiAccessGraphV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { AiAccessCellV1 } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/planning/ai-access-graph-v1";
import { createAiTestOwnedActor } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import { getActorComponent } from "../../../data/actor-component";
import { getGameObjectCurrentTile } from "../../../data/game-object-helper";
import { observeAiScoutSearchPoints } from "./ai-scout-coverage";
import { buildAiScoutSearchPoints } from "./ai-scout-search-points";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/game-object-helper", () => ({ getGameObjectCurrentTile: jest.fn() }));

const cells: AiAccessCellV1[] = Array.from({ length: 16 }, (_, x) => ({
  x,
  y: 0,
  ground: true,
  water: false,
  elevation: 0,
  clearance: 1,
  knowledge: "known_static",
  groundNeighborKeys: [x - 1, x + 1].filter((nx) => nx >= 0 && nx < 16).map((nx) => `${nx},0`)
}));
const graph = buildAiAccessGraphV1({
  generation: 1,
  staticRevision: 1,
  dynamicRevision: 1,
  threatRevision: 0,
  builtTick: 20,
  continuationCursor: 0,
  includeAirRegion: false,
  cells
});
const points = buildAiScoutSearchPoints(cells, graph.groundNodeByTileKey);

function fixture() {
  const actor = createAiTestOwnedActor("scout"),
    live = {} as Phaser.GameObjects.GameObject;
  const index = new Map([[actor.actorId, live]]);
  jest.mocked(getGameObjectCurrentTile).mockReturnValue({ x: 0, y: 0, z: 0 });
  jest.mocked(getActorComponent).mockReturnValue({ range: 2 } as never);
  return { actor, index };
}

describe("player-fair scouting coverage geometry", () => {
  beforeEach(() => jest.resetAllMocks());

  it("SCOUT-01 searches distinct positions in the same connected region using actual owned vision", () => {
    const f = fixture();
    expect(graph.graph.nodes).toHaveLength(1);
    expect(points).toHaveLength(2);
    expect(points[0]?.accessNodeId).toBe(points[1]?.accessNodeId);
    expect(observeAiScoutSearchPoints(points, [f.actor], f.index).map((point) => point.observed)).toEqual([
      false,
      false
    ]);
    jest.mocked(getActorComponent).mockReturnValue({ range: 4 } as never);
    expect(observeAiScoutSearchPoints(points, [f.actor], f.index).map((point) => point.observed)).toEqual([
      true,
      false
    ]);
    jest.mocked(getGameObjectCurrentTile).mockReturnValue({ x: 12, y: 0, z: 0 });
    expect(observeAiScoutSearchPoints(points, [f.actor], f.index).map((point) => point.observed)).toEqual([
      false,
      true
    ]);
    expect(buildAiScoutSearchPoints([...cells].reverse(), graph.groundNodeByTileKey)).toEqual(points);
  });

  it("does not use enemy vision or an absent native vision source", () => {
    const f = fixture();
    expect(
      observeAiScoutSearchPoints(points, [{ ...f.actor, relation: "enemy", visibility: "visible" }], f.index).some(
        (point) => point.observed
      )
    ).toBe(false);
    expect(getActorComponent).not.toHaveBeenCalled();
    jest.mocked(getActorComponent).mockReturnValue(undefined);
    expect(observeAiScoutSearchPoints(points, [f.actor], f.index).some((point) => point.observed)).toBe(false);
  });
});
