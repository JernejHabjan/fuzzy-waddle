import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { emitQueueItemResource } from "../../../data/emit-queue-item-resource";
import { getCommunicator, getPlayer, emitResource, isSnapshotApplyInProgress } from "../../../data/scene-data";
import { AI_DECISION_DISPATCH_EVENT } from "../ai-decision-dispatch-event";
import { unspentClaimFixture } from "./ai-runtime-unspent-claim-fixtures";
import { productionCaptureFixture as setup } from "./ai-runtime-production-capture-fixtures";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/scene-data", () => ({ getPlayer: jest.fn(), getCommunicator: jest.fn(), emitResource: jest.fn(),
  isSnapshotApplyInProgress: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn(), getSceneSystem: jest.fn() }));

describe("native selected-input to producer report capture (authored; final gate pending)", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("retains exact selected decision and scoped native resource operation until report projection", () => {
    const f = setup(), { decision } = unspentClaimFixture();
    f.ticks.currentTick = decision.identity.tick;
    f.scene.events.emit(AI_DECISION_DISPATCH_EVENT, decision);
    jest.mocked(getPlayer).mockReturnValue({ getResources: () => f.money } as never);
    jest.mocked(getCommunicator).mockReturnValue(f.scene.communicator as never);
    jest.mocked(isSnapshotApplyInProgress).mockReturnValue(false);
    jest.mocked(emitResource).mockImplementation((_scene, action, amounts) => {
      const sign = action === "resource.added" ? 1 : -1;
      for (const resource of Object.values(ResourceType)) f.money[resource] += sign * (amounts[resource] ?? 0);
      f.changes.next({ property: action, data: { playerNumber: 2, playerStateData: { resources: amounts } } });
    });
    const item = f.queuedItems[0];
    if (!item) throw new Error("producer_item_missing");
    emitQueueItemResource({ producer: f.actor, item, operation: "immediate_charge", playerNumber: 2,
      amounts: { [ResourceType.Food]: 7 } });

    const capture = f.capture.capture(2);
    const selected = capture.facts.find((fact) => fact.kind === "decision_selected");
    const operation = capture.facts.filter((fact) => fact.kind === "queue_resource");
    expect(selected).toMatchObject({ kind: "decision_selected", decision });
    expect(operation.map((fact) => fact.kind === "queue_resource" ? fact.resource.emission.phase : null))
      .toEqual(["started", "callback", "finished"]);
    expect(operation.at(-1)).toMatchObject({ kind: "queue_resource", resource: {
      operation: "immediate_charge", itemId: "queue:producer:1", playerNumber: 2,
      emission: { before: { food: 100 }, after: { food: 93 }, balanceMatches: true }
    } });
    expect(capture.gaps).toContain("queue_resource_runtime_authority_unverified");
    f.capture.dispose();
    expect(f.scene.events.listenerCount(AI_DECISION_DISPATCH_EVENT)).toBe(0);
  });
});
