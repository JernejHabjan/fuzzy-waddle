import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";

/** Test-owned EasyStar stand-in: callers explicitly complete pending native callbacks, without real pathfinding. */
export class NavigationPathfinderDouble {
  static instances: NavigationPathfinderDouble[] = [];
  readonly setGrid = jest.fn();
  readonly setAcceptableTiles = jest.fn();
  readonly setTileCost = jest.fn();
  readonly enableDiagonals = jest.fn();
  readonly setDirectionalCondition = jest.fn();
  readonly calculate = jest.fn();
  readonly findPath = jest.fn((
    _fromX: number, _fromY: number, _toX: number, _toY: number,
    _complete: (path: Vector2Simple[] | null) => void
  ) => {});

  constructor() {
    NavigationPathfinderDouble.instances.push(this);
  }

  /** Delivers a specific callback once per explicit test call; allows delayed/old rebuild completions. */
  finish(query: number, path: Vector2Simple[] | null): void {
    const call = this.findPath.mock.calls[query];
    if (!call) throw new Error("navigation_test_query_missing");
    call[4](path);
  }
}
