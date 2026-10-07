import type Phaser from "phaser";
import { PawnAiBlackboard } from "../../prefabs/ai-agents/pawn-ai-blackboard";
import { getGameObjectCurrentTile } from "../../data/game-object-helper";
import { MovementCompletionObservation } from "./movement-completion-observation";
import type { MovementCompletionEvent } from "./movement-completion-event";
import type { MovementQueryContext } from "./movement-query-context";

jest.mock("../../data/game-object-helper", () => ({ getGameObjectCurrentTile: jest.fn() }));

describe("passive physical movement boundaries (unrun until final gate)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("allocates no token and reads no position without a listener or explicit context", () => {
    const context: MovementQueryContext = { actor: {} as Phaser.GameObjects.GameObject,
      board: new PawnAiBlackboard(), order: null, caller: "boarding_container_shore" };
    expect(MovementCompletionObservation.begin(context, "path")).toBeUndefined();
    expect(MovementCompletionObservation.begin(undefined, "direct")).toBeUndefined();
    expect(getGameObjectCurrentTile).not.toHaveBeenCalled();
  });

  it("keeps original and fallback destinations detached and stops observing after disposal", () => {
    const events: MovementCompletionEvent[] = [], context: MovementQueryContext = {
      actor: {} as Phaser.GameObjects.GameObject, board: new PawnAiBlackboard(), order: null,
      caller: "boarding_container_shore" };
    const release = MovementCompletionObservation.subscribe(context.board, (event) => events.push(event));
    const destination = { x: 8, y: 9 }, fallback = { x: 7, y: 9 };
    const token = MovementCompletionObservation.begin(context, "path", destination);
    token?.destination(destination); token?.destination(fallback, true);
    destination.x = 99; fallback.x = 99;
    jest.mocked(getGameObjectCurrentTile).mockReturnValue({ x: 7, y: 9, z: 0 });
    token?.terminal("arrived"); token?.terminal("stopped"); token?.returned(true);
    expect(events.map((event) => event.phase)).toEqual(["started", "destination", "destination", "arrived", "returned_true"]);
    expect(events.at(-1)).toMatchObject({ originalDestination: { x: 8, y: 9 }, selectedDestination: { x: 7, y: 9 },
      actualTile: { x: 7, y: 9 }, fallback: true });
    release(); jest.mocked(getGameObjectCurrentTile).mockClear(); token?.returned(false);
    expect(getGameObjectCurrentTile).not.toHaveBeenCalled();
  });

  it("isolates a failing listener and bounds subscriptions at eight", () => {
    const context: MovementQueryContext = { actor: {} as Phaser.GameObjects.GameObject,
      board: new PawnAiBlackboard(), order: null, caller: "boarding_container_shore" };
    const releases = [MovementCompletionObservation.subscribe(context.board, () => { throw new Error("observer"); })];
    const good = jest.fn(), ninth = jest.fn();
    for (let index = 0; index < 7; index++) releases.push(MovementCompletionObservation.subscribe(context.board, good));
    releases.push(MovementCompletionObservation.subscribe(context.board, ninth));
    const token = MovementCompletionObservation.begin(context, "direct", { x: 1, y: 0 });
    token?.destination({ x: 1, y: 0 }); token?.terminal("stopped");
    expect(good).toHaveBeenCalledTimes(21); expect(ninth).not.toHaveBeenCalled();
    releases.forEach((release) => release());
  });
});
