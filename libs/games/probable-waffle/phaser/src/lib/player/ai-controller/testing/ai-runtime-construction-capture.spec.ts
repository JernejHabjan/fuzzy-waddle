import { ConstructionStateEnum } from "@fuzzy-waddle/probable-waffle-protocol";
import { isSnapshotApplyInProgress } from "../../../data/scene-data";
import { observeConstructionLifecycle, observeConstructionResource } from
  "../../../entity/components/construction/observe-construction-authority";
import { CONSTRUCTION_AUTHORITY_EVENT } from "../../../entity/components/construction/construction-authority-event";
import { productionCaptureFixture } from "./ai-runtime-production-capture-fixtures";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/scene-data", () => ({ getPlayer: jest.fn(), getCommunicator: jest.fn(), isSnapshotApplyInProgress: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn(), getSceneSystem: jest.fn() }));

describe("marked construction capture", () => {
  it("retains detached resource/restore callbacks in raw order and releases the listener on disposal", () => {
    const f = productionCaptureFixture(); jest.mocked(isSnapshotApplyInProgress).mockReturnValue(true);
    const definition = { costType: 0, productionTime: 150, resources: { food: 11 }, refundFactor: 1 };
    observeConstructionResource({ site: f.actor, state: ConstructionStateEnum.NotStarted, remainingWorkMs: 0,
      definition, operation: "start_charge", owner: undefined, amounts: null, refundFactor: null, noEmission: "skipped" });
    observeConstructionLifecycle(f.actor, ConstructionStateEnum.Constructing, 75, "restored");
    const captured = f.capture.capture(2);
    expect(captured.initialConstruction).toMatchObject({ tick: 0, sites: [], gaps: [] });
    const records = captured.facts.filter((fact) => fact.kind === "construction_authority");
    expect(records.map((fact) => fact.construction.kind)).toEqual(["resource", "lifecycle"]);
    expect(records[0].construction).toMatchObject({ site: { actorId: "producer", playerNumber: 2 },
      status: "skipped", clockTick: 0, snapshotRestoreInProgress: true, configuredCost: { food: 11 } });
    definition.resources.food = 99;
    expect(records[0].construction.kind === "resource" && records[0].construction.configuredCost).toEqual({ food: 11 });
    f.capture.dispose(); expect(f.scene.events.listenerCount(CONSTRUCTION_AUTHORITY_EVENT)).toBe(0);
  });

  it("retains a missing explicit resource owner without substituting the site's owner", () => {
    const f = productionCaptureFixture(); jest.mocked(isSnapshotApplyInProgress).mockReturnValue(false);
    observeConstructionResource({ site: f.actor, state: ConstructionStateEnum.NotStarted, remainingWorkMs: 0,
      definition: { costType: 1, productionTime: 150, resources: { food: 11 }, refundFactor: 1 },
      operation: "cancel_refund", owner: undefined, amounts: { food: 5 }, refundFactor: 0.5 }, () => undefined);
    const fact = f.capture.capture(2).facts.find((entry) => entry.kind === "construction_authority");
    expect(fact?.kind === "construction_authority" && fact.construction).toMatchObject({
      ownerArgument: null, before: null, after: null, callbackCount: 0, balanceMatches: false });
    f.capture.dispose();
  });
});
