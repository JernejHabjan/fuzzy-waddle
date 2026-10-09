import Phaser from "phaser";
import type { AiCapabilityCatalogV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { FactionType, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import {
  createAiTestObservation,
  requireAiTestEntry
} from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import { createAiBrainStateV1 } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/create-ai-brain-state-v1";
import { createAiProfileConfigV1 } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/profiles/ai-profile-defaults";
import { projectAiDebugSnapshot } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/debug/project-ai-debug-snapshot";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { isSnapshotApplyInProgress } from "../../data/scene-data";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../world/services/simulation-tick.service";
import { AI_DECISION_DISPATCH_EVENT, type AiDecisionDispatchEvent } from "./ai-decision-dispatch-event";
import { captureAiDecisionInput } from "./capture-ai-decision-input";
import { dispatchAiBrainResult } from "./dispatch-ai-brain-result";
import { dispatchAiIntents } from "./ai-intent-dispatcher";
import { PlayerAiController } from "./player-ai-controller";

jest.mock("../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("../../data/scene-data", () => ({ isSnapshotApplyInProgress: jest.fn() }));
jest.mock("./ai-intent-dispatcher", () => ({ dispatchAiIntents: jest.fn() }));

/** Actual-shaped consumed inputs; these synthetic authorities do not prove a live decision or path. */
function fixture() {
  const events = new Phaser.Events.EventEmitter();
  const scene = { events } as unknown as ProbableWaffleScene;
  const base = createAiTestObservation();
  const actor = requireAiTestEntry(base.actors, 0);
  if (!actor) throw new Error("synthetic_actor_missing");
  const known = <T>(value: T) => ({ status: "known" as const, value, observedTick: 99 });
  const observation = {
    ...base,
    playerNumber: 2,
    tick: 99,
    generation: 7,
    actors: [
      {
        ...actor,
        owner: 2,
        observedTick: 99,
        logicalPosition: known({ x: 4, y: 5, z: 0 }),
        accessNodeId: known("access:main" as const),
        effectiveLevel: known(1),
        housingCost: known(1)
      }
    ],
    threatSummary: { ...base.threatSummary, observedTick: 99 }
  };
  const catalog = { schemaVersion: 1, generation: 7, entries: [], unsupported: [] } satisfies AiCapabilityCatalogV1;
  const ticks = { currentTick: 101 };
  jest
    .mocked(getSceneService)
    .mockImplementation((_scene, service) => (service === SimulationTickService ? (ticks as never) : undefined));
  jest.mocked(isSnapshotApplyInProgress).mockReturnValue(false);
  return { scene, events, observation, catalog, ticks };
}

describe("consumed AI decision inputs", () => {
  beforeEach(() => jest.clearAllMocks());

  it("avoids authority reads without a decision listener and retains fallback/restore explicitly", () => {
    const f = fixture();
    expect(captureAiDecisionInput(f.scene, f.observation, f.catalog, 250, 8)).toBeUndefined();
    expect(getSceneService).not.toHaveBeenCalled();
    expect(isSnapshotApplyInProgress).not.toHaveBeenCalled();
    f.events.on(AI_DECISION_DISPATCH_EVENT, () => undefined);
    jest.mocked(getSceneService).mockReturnValue(undefined);
    jest.mocked(isSnapshotApplyInProgress).mockReturnValue(true);
    expect(captureAiDecisionInput(f.scene, f.observation, f.catalog, 250, 8)).toMatchObject({
      cadence: { clock: "render_fallback", tick: null, configuredIntervalTicks: 5, completedBefore: 8 },
      snapshotRestoreInProgress: true
    });
  });

  it("captures empty selected steps from the real controller seam before dispatch and later debug/state adoption", () => {
    const f = fixture();
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const state = createAiBrainStateV1({
      playerNumber: 2,
      faction: FactionType.Tivara,
      tick: 99,
      archetypeId: "balanced",
      profile
    });
    const result = {
      nextState: state,
      acceptedIntents: [],
      decisions: [],
      trace: [],
      debugSnapshot: projectAiDebugSnapshot(f.observation, state, [])
    };
    const controller = Object.create(PlayerAiController.prototype) as PlayerAiController;
    const step = jest.fn(() => result);
    Reflect.set(controller, "scene", f.scene);
    Reflect.set(controller, "player", { playerNumber: 2 });
    Reflect.set(controller, "brainState", state);
    Reflect.set(controller, "pureBrain", { step });
    Reflect.set(controller, "profile", profile);
    Reflect.set(controller, "stepInterval", 250);
    Reflect.set(controller, "completedDecisionSequence", 8);
    Reflect.set(controller, "brainDebugHistory", []);
    Reflect.set(controller, "playerAiControllerAgent", {
      getCommittedObservation: () => f.observation,
      getCommittedCapabilityCatalog: () => f.catalog
    });
    const records: AiDecisionDispatchEvent[] = [];
    f.events.on(AI_DECISION_DISPATCH_EVENT, (event: AiDecisionDispatchEvent) => {
      expect(controller.getBrainDebugSnapshot()).toBeUndefined();
      records.push(event);
    });
    (controller as unknown as { stepPureBrain(): void }).stepPureBrain();
    expect(step).toHaveBeenCalledWith(f.observation, state, []);
    expect(dispatchAiIntents).toHaveBeenCalledTimes(1);
    expect(requireAiTestEntry(records, 0).input).toMatchObject({
      observation: { tick: 99, generation: 7 },
      capabilityCatalog: { generation: 7 },
      cadence: { clock: "simulation", tick: 101, configuredIntervalTicks: 5, completedBefore: 8 }
    });
    f.observation.tick = 102;
    f.catalog.generation = 9;
    expect(requireAiTestEntry(records, 0).input?.observation?.tick).toBe(99);
    expect(requireAiTestEntry(records, 0).input?.capabilityCatalog?.generation).toBe(7);
  });

  it("marks oversized observations as missing rather than returning a truncated fair world", () => {
    const f = fixture();
    f.events.on(AI_DECISION_DISPATCH_EVENT, () => undefined);
    const actor = requireAiTestEntry(f.observation.actors, 0);
    if (!actor) throw new Error("synthetic_actor_missing");
    const input = captureAiDecisionInput(
      f.scene,
      { ...f.observation, actors: Array(257).fill(actor) },
      f.catalog,
      250,
      8
    );
    expect(input?.observation).toBeNull();
    expect(input?.gaps).toContain("production_decision_observation_overflow");
    const records: AiDecisionDispatchEvent[] = [];
    f.events.on(AI_DECISION_DISPATCH_EVENT, (event: AiDecisionDispatchEvent) => records.push(event));
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const state = createAiBrainStateV1({
      playerNumber: 2,
      faction: FactionType.Tivara,
      tick: 99,
      archetypeId: "balanced",
      profile
    });
    dispatchAiBrainResult(
      f.scene,
      2,
      {
        nextState: state,
        acceptedIntents: [],
        decisions: [],
        trace: [],
        debugSnapshot: projectAiDebugSnapshot(f.observation, state, [])
      },
      state.authority,
      input
    );
    expect(requireAiTestEntry(records, 0).input?.observation).toBeNull();
  });
});
