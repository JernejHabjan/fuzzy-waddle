import { PlayerAiController } from "./player-ai-controller";

function fixture(pure: boolean) {
  const controller = Object.create(PlayerAiController.prototype) as PlayerAiController;
  const clock = { tick: 40 };
  const decisions: number[] = [];
  const preTick = jest.fn(async () => {
    clock.tick++;
  });
  const preparePureDecision = jest.fn();
  for (const [key, value] of Object.entries({
    enabled: true,
    authorityActive: true,
    elapsedTime: 1000,
    stepInterval: 1000,
    completedDecisionSequence: 0,
    pureBrain: pure ? {} : undefined,
    scene: { time: { now: 2000 } },
    playerAiControllerAgent: { preTick, preparePureDecision },
    stepDecisionPlanner: () => decisions.push(clock.tick),
    telemetry: {
      nextFrame: () => undefined,
      snapshot: () => ({ frame: 1 }),
      withSpan: (_name: string, action: () => void) => action(),
      withSpanAsync: async (_name: string, action: () => Promise<void>) => await action(),
      recordEvent: jest.fn()
    }
  }))
    Reflect.set(controller, key, value);
  const run = () => (controller as unknown as { runScheduledStep(): Promise<void> }).runScheduledStep();
  return { controller, clock, decisions, preTick, preparePureDecision, run };
}

it("selects each pure step before another tick in the same render task", async () => {
  const f = fixture(true);
  const first = f.run();
  expect(f.decisions).toEqual([40]);
  f.clock.tick = 60;
  Reflect.set(f.controller, "elapsedTime", 1000);
  const second = f.run();
  expect(f.decisions).toEqual([40, 60]);
  await Promise.all([first, second]);
  expect(f.preTick).not.toHaveBeenCalled();
  expect(f.preparePureDecision).toHaveBeenCalledTimes(2);
  expect(Reflect.get(f.controller, "completedDecisionSequence")).toBe(2);
});

it("retains asynchronous legacy preparation", async () => {
  const f = fixture(false);
  const pending = f.run();
  expect(f.decisions).toEqual([]);
  await pending;
  expect(f.decisions).toEqual([41]);
  expect(f.preparePureDecision).not.toHaveBeenCalled();
});

it.each(["disabled", "authority_lost", "capture_failed"])(
  "does not select after %s during preparation",
  async (reason) => {
    const f = fixture(true);
    f.preparePureDecision.mockImplementation(() => {
      if (reason === "capture_failed") throw new Error("capture_failed");
      Reflect.set(f.controller, reason === "disabled" ? "enabled" : "authorityActive", false);
    });
    const log = jest.spyOn(console, "log").mockImplementation(() => undefined);
    try {
      await f.run();
      expect(f.decisions).toEqual([]);
    } finally {
      log.mockRestore();
    }
  }
);
