import { PlayerAiControllerAgent } from "./player-ai-controller.agent";
import { getSceneService } from "../../world/services/scene-component-helpers";

jest.mock("../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));

function fixture() {
  const agent = Object.create(PlayerAiControllerAgent.prototype) as PlayerAiControllerAgent;
  const clock = { currentTick: 40 },
    events: string[] = [];
  const world = {
    updateOwned: jest.fn(() => {
      events.push("owned");
    }),
    update: jest.fn(async () => {
      events.push("legacy_world");
      clock.currentTick = 41;
    })
  };
  const targeting = {
    update: jest.fn(async () => {
      events.push("legacy_target");
      clock.currentTick = 42;
    })
  };
  const refreshNow = jest.fn((tick: number) => {
    events.push(`observation:${tick}`);
    return { tick };
  });
  const refresh = jest.fn(async (tick: number) => refreshNow(tick));
  const observationPipeline = {
    refresh,
    refreshNow,
    getObservation: () => undefined as { tick: number } | undefined,
    getDebugSnapshot: () => ({ lastCommitError: null as string | null }),
    getLastCommitErrorStage: (): string | null => null,
    getLastCommitErrorCode: (): string | null => null
  };
  Reflect.set(agent, "scene", {});
  Reflect.set(agent, "worldStateSnapshotManager", world);
  Reflect.set(agent, "targetingManager", targeting);
  Reflect.set(agent, "observationPipeline", observationPipeline);
  Reflect.set(agent, "economyManager", {
    update: () => {
      events.push("economy");
    }
  });
  Reflect.set(agent, "scoutingManager", {
    updateVisionSampling: () => {
      events.push("vision");
    }
  });
  Reflect.set(agent, "cooldowns", { canRun: () => false });
  Reflect.set(agent, "processPrerequisiteQueue", () => {
    events.push("prerequisites");
  });
  jest.mocked(getSceneService).mockReturnValue(clock as never);
  return { agent, clock, events, world, targeting, refreshNow, observationPipeline };
}

afterEach(() => jest.resetAllMocks());

it("selects pure observations on their tick without awaiting legacy path work", async () => {
  const f = fixture();
  f.agent.setPurePlannerOwnsCommands(true);
  await f.agent.preTick(2000);
  expect(f.clock.currentTick).toBe(40);
  expect(f.events).toEqual(["owned", "economy", "vision", "observation:40"]);
  expect(f.world.update).not.toHaveBeenCalled();
  expect(f.targeting.update).not.toHaveBeenCalled();
});

it("retains legacy preparation and prerequisite order when the pure brain does not own commands", async () => {
  const f = fixture();
  f.agent.setPurePlannerOwnsCommands(false);
  await f.agent.preTick(2000);
  expect(f.events).toEqual(["observation:40", "legacy_world", "economy", "vision", "legacy_target", "prerequisites"]);
  expect(f.world.updateOwned).not.toHaveBeenCalled();
});

it("rejects a retained old observation when the current capture fails", () => {
  const f = fixture();
  f.refreshNow.mockReturnValue({ tick: 39 });
  expect(() => f.agent.preparePureDecision(2000)).toThrow("ai_current_decision_observation_unavailable");
});

it("classifies capture failures without exposing the underlying capture error", () => {
  const f = fixture();
  f.refreshNow.mockReturnValue(undefined as never);
  f.observationPipeline.getDebugSnapshot = () => ({ lastCommitError: "hidden internal detail" });
  f.observationPipeline.getLastCommitErrorStage = () => "actor_projection";
  f.observationPipeline.getLastCommitErrorCode = () => "missing_scene";
  expect(() => f.agent.preparePureDecision(2000)).toThrow(
    "ai_current_decision_observation_unavailable:capture_failed:actor_projection:missing_scene"
  );
});
