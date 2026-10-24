import Phaser from "phaser";
import { Subject } from "rxjs";
import { getActorComponent } from "../../../data/actor-component";
import { getGameObjectCurrentTile } from "../../../data/game-object-helper";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { NavigationService } from "../../../world/services/navigation.service";
import { IsoHelper } from "../../../world/tilemap/iso-helper";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import type { AiRuntimePresetWorldV1 } from "./ai-runtime-preset-world-v1";
import type { AiRuntimePresetControlV1 } from "./ai-runtime-preset-control-v1";
import { AI_RUNTIME_PRESET_CONTROL_EVENT, type AiRuntimePresetControlEvent } from "./ai-runtime-preset-control-event";
import { installAiRuntimePresetControls } from "./install-ai-runtime-preset-controls";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/game-object-helper", () => ({ getGameObjectCurrentTile: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("../../../world/tilemap/iso-helper", () => ({ IsoHelper: { isometricWorldToTileXY: jest.fn() } }));

/** Isolated command seam: assertions cover authority/identity and teardown, not physical movement acceptance. */
function setup(action: AiRuntimePresetControlV1["action"], active = true, targetOwner = 2, applicationTick = 1) {
  const tick$ = new Subject<number>(), onShutdown = new Subject<void>();
  const clock = { currentTick: 0, tick$ };
  const scene = { events: new Phaser.Events.EventEmitter(), onShutdown } as unknown as ProbableWaffleScene;
  const source = { scene, active } as unknown as Phaser.GameObjects.GameObject;
  const target = { scene, active: true } as unknown as Phaser.GameObjects.GameObject;
  jest.mocked(getActorComponent).mockImplementation((actor, component) => {
    if (component === IdComponent) return { id: actor === source ? "source" : "target" } as never;
    if (component === OwnerComponent) return { getOwner: () => actor === source ? 2 : targetOwner } as never;
    if (component === HealthComponent) return { killed: false } as never;
    return undefined;
  });
  jest.mocked(getGameObjectCurrentTile).mockReturnValue({ x: 12, y: 14 });
  jest.mocked(IsoHelper.isometricWorldToTileXY).mockReturnValue({ x: 9, y: 11 });
  const dispatchDeterministic = jest.fn((input) => ({ status: "dispatched", command: {
    ...input, tick: clock.currentTick, execution: { source: "human", commandId: "native-control" }
  } }));
  const bus = { dispatchDeterministic, commandOutcome$: new Subject() };
  const navigation = { getTileWorldCenter: () => ({ x: 320, y: 240 }) };
  jest.mocked(getSceneService).mockImplementation((_scene, service) =>
    (service === SimulationTickService ? clock : service === NavigationService ? navigation : bus) as never
  );
  const records: AiRuntimePresetControlEvent[] = [];
  scene.events.on(AI_RUNTIME_PRESET_CONTROL_EVENT, (event: AiRuntimePresetControlEvent) => records.push(event));
  const preset: AiRuntimePresetWorldV1 = { fixtureId: "native-movement", actors: [], resourceGrants: [],
    provenance: { sourceRevision: "a".repeat(40), fixtureDigest: "fnv1a32:00000000" },
    controls: [{ id: "move-probe", requestTick: 0, applicationTick, producerFixtureActorId: "source", action }] };
  installAiRuntimePresetControls(scene, preset, new Map([["source", source], ["target", target]]));
  const advance = () => { clock.currentTick = 1; tick$.next(1); };
  return { advance, dispatchDeterministic, records, source, target, onShutdown, tick$ };
}

it("dispatches ordinary world movement and resolves a target's actual tile without copying its height", () => {
  const f = setup({ kind: "move", worldPosition: { x: 100, y: 200, z: 0 } });
  f.advance();
  expect(f.dispatchDeterministic).toHaveBeenCalledWith(expect.objectContaining({ type: "MOVE", actorIds: ["source"],
    tileVec3: { x: 9, y: 11, z: 0 }, worldVec3: { x: 100, y: 200, z: 0 }, queue: false }), "human");
  const bound = setup({ kind: "move_to_actor", targetFixtureActorId: "target" });
  bound.advance();
  expect(bound.dispatchDeterministic).toHaveBeenCalledWith(expect.objectContaining({ type: "MOVE",
    tileVec3: { x: 12, y: 14, z: 0 }, worldVec3: { x: 320, y: 240, z: 0 } }), "human");
});

it("attacks only a live opposing original role and refuses a cross-owner movement target", () => {
  const f = setup({ kind: "attack", targetFixtureActorId: "target" }, true, 1);
  f.advance();
  expect(f.dispatchDeterministic).toHaveBeenCalledWith(expect.objectContaining({ type: "ACTOR_ACTION",
    orderType: "Attack", targetObjectIds: ["target"] }), "human");
  expect(() => setup({ kind: "move_to_actor", targetFixtureActorId: "target" }, true, 1, 0)).toThrow("move_target_missing");
});

it("records a dead original controller as unavailable, never dispatched success, and detaches on shutdown", () => {
  const f = setup({ kind: "move", worldPosition: { x: 100, y: 200, z: 0 } }, false);
  f.advance();
  expect(f.dispatchDeterministic).not.toHaveBeenCalled();
  expect(f.records.map((record) => record.phase)).toEqual(["requested", "unavailable"]);
  expect(f.records.at(-1)?.command).toBeNull();
  expect(f.tick$.observed).toBe(false);
  const pending = setup({ kind: "move", worldPosition: { x: 100, y: 200, z: 0 } });
  pending.onShutdown.next();
  pending.advance();
  expect(pending.dispatchDeterministic).not.toHaveBeenCalled();
});
