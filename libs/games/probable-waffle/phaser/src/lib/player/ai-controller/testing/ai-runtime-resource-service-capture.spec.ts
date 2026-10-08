import type Phaser from "phaser";
import { ResourceType, ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { ResourceServiceObservation } from "../../../entity/components/resource/resource-service-observation";
import { captureAiRuntimeCreatedActor } from "./capture-ai-runtime-created-actor";
import { AiRuntimeResourceServiceCapture } from "./ai-runtime-resource-service-capture";
import type { AiRuntimeProductionSpatialV1 } from "./ai-runtime-production-spatial-v1";

jest.mock("./capture-ai-runtime-created-actor", () => ({ captureAiRuntimeCreatedActor: jest.fn() }));

describe("detached cargo/credit capture (unrun until final gate)", () => {
  it("caps distinct observers and insulates a native cargo mutation from broken listeners", () => {
    const actor = {} as Phaser.GameObjects.GameObject, native = jest.fn(), sample = () => ({ amount: 0, resourceType: null });
    const listener = jest.fn(), releases = Array.from({ length: 8 }, () =>
      ResourceServiceObservation.subscribe(actor, () => { listener(); throw new Error("diagnostic"); }));
    const extra = jest.fn(), releaseExtra = ResourceServiceObservation.subscribe(actor, extra);
    ResourceServiceObservation.change(actor, {}, sample, { reason: "reset" }, native);
    expect(native).toHaveBeenCalledTimes(1); expect(listener).toHaveBeenCalledTimes(8); expect(extra).not.toHaveBeenCalled();
    releases.forEach((release) => release()); releaseExtra();
    expect(ResourceServiceObservation.observed(actor)).toBe(false);
  });
  it("keeps old transfer identity across restore, detaches samples and disposes pending observation", () => {
    const scene = {} as Phaser.Scene, actor = { scene } as Phaser.GameObjects.GameObject, target = { scene } as
      Phaser.GameObjects.GameObject, owner = {}, execution = {};
    jest.mocked(captureAiRuntimeCreatedActor).mockReturnValue({ actorId: "worker", objectName: ObjectNames.TivaraWorker,
      canonicalObjectName: ObjectNames.TivaraWorker, playerNumber: 1, active: true, alive: true, finished: true, indexed: true });
    let token = {}; const originalToken = token;
    const records: AiRuntimeProductionSpatialV1[] = [];
    const capture = new AiRuntimeResourceServiceCapture(scene,
      () => ({ clockTick: 10, sceneActive: true, snapshotRestoreInProgress: false }),
      (value) => value === execution ? { attemptId: 7, lifetimeValid: token === originalToken } : undefined,
      (_owner, value) => records.push(value));
    const release = capture.watch(actor, () => token);
    const cargo = { amount: 3, resourceType: ResourceType.Wood };
    const context = ResourceServiceObservation.offer(actor, owner, target, () => cargo, execution);
    cargo.amount = 99;
    expect(records[0]).toMatchObject({ phase: "cargo_offered", cargoId: 1, transferId: 1, attemptId: 7, cargo: { amount: 3 } });
    token = {};
    ResourceServiceObservation.change(actor, owner, () => cargo, { reason: "restore" }, () => undefined);
    ResourceServiceObservation.publish({ actor, target, kind: "resource_credit", context, channel: "drop_off",
      resourceType: ResourceType.Wood, amount: 3, ownerArgument: 2, beneficiary: 2, status: "campaign_suppressed",
      before: null, after: null, callbackAmounts: null, callbackCount: 0, interference: false,
      snapshotRestoreInProgress: false, balanceMatches: false });
    expect(records.at(-1)).toMatchObject({ cargoId: 1, transferId: 1, attemptId: 7, lifetimeValid: false, beneficiary: 2 });
    ResourceServiceObservation.offer(actor, owner, target, () => cargo);
    expect(records.at(-1)).toMatchObject({ cargoId: 3, transferId: 2, attemptId: null });
    const count = records.length; release();
    ResourceServiceObservation.change(actor, owner, () => cargo, { reason: "reset" }, () => { cargo.amount = 0; });
    expect(records).toHaveLength(count); expect(cargo.amount).toBe(0);
  });
});
