import Phaser from "phaser";
import { State } from "mistreevous";
import { environment } from "@fuzzy-waddle/environments/environment";
import { PawnAiController } from "./pawn-ai-controller";
import { AiType } from "./ai-type";
import * as definition from "./player-pawn-ai-controller.mdsl";
import { PlayerPawnAiControllerAgent } from "./player-pawn-ai-controller.agent";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { getActorComponent } from "../../data/actor-component";
import { DebuggingService } from "../../world/services/DebuggingService";
import { SimulationPauseReason, SimulationTickService } from "../../world/services/simulation-tick.service";
import { HealthComponent } from "../../entity/components/combat/components/health-component";

jest.mock("../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("./player-pawn-ai-controller.mdsl", () => ({
  __esModule: true,
  PlayerPawnAiControllerMdsl: "root { sequence { wait [250] action [Succeed] } }"
}));

/** The test-owned module accepts authored trees; the production definition remains an exact literal. */
const treeDefinition: { readonly PlayerPawnAiControllerMdsl: string } = definition;

/** Real controller, tick service, native GameObject and installed tree; authored MDSL isolates WAIT timing. */
function fixture(stepInterval?: number, fallback = false) {
  let sceneActive = true;
  const scene = new Phaser.Scene();
  const events = new Phaser.Events.EventEmitter();
  const time = { timeScale: 1 };
  Object.assign(scene, {
    events,
    time,
    scene: { scene, isActive: () => sceneActive },
    sys: { isActive: () => sceneActive, queueDepthSort: () => undefined }
  });
  const actor = new Phaser.GameObjects.GameObject(scene, "pawn-clock-control");
  const ticks = fallback ? undefined : new SimulationTickService(scene);
  const debugging = new DebuggingService();
  jest.mocked(getSceneService).mockImplementation((_scene, token) => {
    if (token === SimulationTickService) return ticks;
    if (token === DebuggingService) return debugging;
    return undefined;
  });
  const completed = jest.spyOn(PlayerPawnAiControllerAgent.prototype, "Succeed");
  const interrupted = jest.spyOn(PlayerPawnAiControllerAgent.prototype, "reportInterruptedOrdersOnShutdown");
  const controller = new PawnAiController(actor, { type: AiType.Character, stepInterval });
  const frame = (delta = 50) => events.emit(Phaser.Scenes.Events.UPDATE, 0, delta);
  const advance = (count: number) => {
    for (let index = 0; index < count; index++) frame();
  };
  return {
    actor,
    scene,
    events,
    time,
    ticks,
    debugging,
    controller,
    completed,
    interrupted,
    frame,
    advance,
    setSceneActive: (active: boolean) => {
      sceneActive = active;
    }
  };
}

describe("PawnAiController simulation WAIT clock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getActorComponent).mockReturnValue(undefined);
    jest.spyOn(Date.prototype, "getTime").mockReturnValue(1000);
  });
  afterEach(() => jest.restoreAllMocks());

  it.each([false, true])(
    "advances a 250 ms WAIT on the default cadence with production=%s and frozen wall time",
    (production) => {
      jest.replaceProperty(environment, "production", production);
      const f = fixture();
      f.advance(1);
      expect(f.completed).not.toHaveBeenCalled();
      f.advance(4);
      expect(f.completed).not.toHaveBeenCalled();
      f.advance(1);
      expect(f.completed).toHaveBeenCalledTimes(1);
    }
  );

  it("uses actual 150 ms steps when a 125 ms cadence overshoots, without carrying an extra step", () => {
    jest.replaceProperty(
      treeDefinition,
      "PlayerPawnAiControllerMdsl",
      "root { sequence { wait [280] action [Succeed] } }"
    );
    const f = fixture(125);
    f.advance(5);
    expect(f.completed).not.toHaveBeenCalled();
    f.advance(1);
    expect(f.completed).toHaveBeenCalledTimes(1);
    f.advance(3);
    expect(f.completed).toHaveBeenCalledTimes(1);
    f.advance(3);
    expect(f.completed).toHaveBeenCalledTimes(2);
  });

  it("uses the 50 ms tick delta when the configured interval is shorter than one tick", () => {
    const f = fixture(25);
    f.advance(4);
    expect(f.completed).not.toHaveBeenCalled();
    f.advance(1);
    expect(f.completed).toHaveBeenCalledTimes(1);
  });

  it("retains the library's entry-update delta for a newly reached WAIT", () => {
    jest.replaceProperty(
      treeDefinition,
      "PlayerPawnAiControllerMdsl",
      "root { sequence { action [Fail] wait [150] action [Succeed] } }"
    );
    const gate = jest.spyOn(PlayerPawnAiControllerAgent.prototype, "Fail").mockReturnValue(State.RUNNING);
    const f = fixture();
    f.advance(2);
    expect(f.completed).not.toHaveBeenCalled();
    gate.mockReturnValue(State.SUCCEEDED);
    f.advance(2);
    expect(f.completed).not.toHaveBeenCalled();
    f.advance(2);
    expect(f.completed).toHaveBeenCalledTimes(1);
  });

  it("completes a 5 ms polling WAIT on its first 100 ms update instead of waiting for wall time", () => {
    jest.replaceProperty(
      treeDefinition,
      "PlayerPawnAiControllerMdsl",
      "root { sequence { wait [5] action [Succeed] } }"
    );
    const f = fixture();
    f.advance(2);
    expect(f.completed).toHaveBeenCalledTimes(1);
  });

  it("completes the native 1500 ms growth delay after fifteen default-cadence updates", () => {
    jest.replaceProperty(
      treeDefinition,
      "PlayerPawnAiControllerMdsl",
      "root { sequence { wait [1500] action [Succeed] } }"
    );
    const f = fixture();
    f.advance(29);
    expect(f.completed).not.toHaveBeenCalled();
    f.advance(1);
    expect(f.completed).toHaveBeenCalledTimes(1);
  });

  it("still lets the installed library's growth guard interrupt a running WAIT", () => {
    jest.replaceProperty(
      treeDefinition,
      "PlayerPawnAiControllerMdsl",
      "root { sequence { succeed { wait [1500] until [GrowthReady] } action [Succeed] } }"
    );
    const ready = jest.spyOn(PlayerPawnAiControllerAgent.prototype, "GrowthReady").mockReturnValue(false);
    const f = fixture();
    f.advance(2);
    expect(f.completed).not.toHaveBeenCalled();
    ready.mockReturnValue(true);
    f.advance(2);
    expect(f.completed).toHaveBeenCalledTimes(1);
    expect(ready).toHaveBeenCalled();
  });

  it("does not count paused frames or a snapshot tick jump as WAIT duration", () => {
    const f = fixture();
    if (!f.ticks) throw new Error("clock_fixture_ticks_missing");
    f.advance(3);
    f.ticks.pauseTick(SimulationPauseReason.Lockstep);
    f.frame(10000);
    f.ticks.fastForwardTo(9000);
    jest.spyOn(Date.prototype, "getTime").mockReturnValue(100000);
    expect(f.completed).not.toHaveBeenCalled();
    f.ticks.resumeTick(SimulationPauseReason.Lockstep);
    f.advance(2);
    expect(f.completed).not.toHaveBeenCalled();
    f.advance(1);
    expect(f.completed).toHaveBeenCalledTimes(1);
  });

  it("does not count inactive actor or inactive scene ticks", () => {
    const f = fixture();
    f.advance(3);
    f.actor.active = false;
    f.advance(20);
    f.actor.active = true;
    f.setSceneActive(false);
    f.advance(20);
    f.setSceneActive(true);
    f.advance(2);
    expect(f.completed).not.toHaveBeenCalled();
    f.advance(1);
    expect(f.completed).toHaveBeenCalledTimes(1);
  });

  it("does not count dead actor ticks even before its killed event is delivered", () => {
    const f = fixture();
    f.advance(3);
    jest.mocked(getActorComponent).mockReturnValue({ killed: true } satisfies Pick<HealthComponent, "killed">);
    f.advance(20);
    expect(f.completed).not.toHaveBeenCalled();
    jest.mocked(getActorComponent).mockReturnValue(undefined);
    f.advance(2);
    expect(f.completed).not.toHaveBeenCalled();
    f.advance(1);
    expect(f.completed).toHaveBeenCalledTimes(1);
  });

  it.each([HealthComponent.KilledEvent, Phaser.GameObjects.Events.DESTROY])("stops tick updates after %s", (event) => {
    const f = fixture();
    f.advance(3);
    f.actor.emit(event);
    f.advance(20);
    expect(f.completed).not.toHaveBeenCalled();
    expect(f.interrupted).toHaveBeenCalledTimes(1);
    expect(f.debugging.debugChanged.observed).toBe(false);
  });

  it("uses actual scaled frame delta on the isolated fallback and removes its listener on teardown", () => {
    const f = fixture(100, true);
    f.time.timeScale = 0.5;
    f.frame(300);
    expect(f.completed).not.toHaveBeenCalled();
    f.time.timeScale = 0;
    f.frame(10000);
    f.time.timeScale = 0.5;
    f.frame(200);
    expect(f.completed).toHaveBeenCalledTimes(1);
    f.actor.emit(Phaser.GameObjects.Events.DESTROY);
    f.frame(20000);
    expect(f.completed).toHaveBeenCalledTimes(1);
  });

  it("resets WAIT progress on native blackboard cancellation while keeping its existing cadence", () => {
    const f = fixture();
    f.advance(4);
    f.controller.blackboard.resetCurrentOrder();
    f.advance(4);
    expect(f.completed).not.toHaveBeenCalled();
    f.advance(2);
    expect(f.completed).toHaveBeenCalledTimes(1);
    expect(Object.keys(f.controller.getData())).toEqual(["blackboard"]);
  });
});
