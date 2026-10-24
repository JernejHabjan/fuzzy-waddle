import type Phaser from "phaser";
import { ProbableWaffleGameInstance } from "@fuzzy-waddle/probable-waffle-protocol";
import { ProbableWafflePlayer, ProbableWafflePlayerState, ProbableWafflePlayerController } from
  "@fuzzy-waddle/probable-waffle-protocol";
import { OwnerComponent } from "./owner-component";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { subscribeSceneResourceLoss } from "../../data/scene-resource-observation";
import { AiRuntimeRecipientResourceCapture } from "../../player/ai-controller/testing/ai-runtime-recipient-resource-capture";
import { AiRuntimeResourceCoverageCapture } from "../../player/ai-controller/testing/ai-runtime-resource-coverage-capture";
import type { AiRuntimeProductionFactV1 } from "../../player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";

jest.mock("./owner-presentation", () => ({ OwnerPresentation: class {
  attach() {} tryToSetComponents() {} assignOwnerColor() {} setOwnerColorToActor() {} playBlinkEffect() {}
} }));
jest.mock("../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../data/player-relation", () => ({ arePlayersAllied: jest.fn() }));
jest.mock("../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("../../world/services/ActorIndexSystem", () => ({ ActorIndexSystem: class {} }));

function fixture() {
  const player = new ProbableWafflePlayer(new ProbableWafflePlayerState(), new ProbableWafflePlayerController());
  Object.defineProperty(player, "playerNumber", { value: 2 });
  const gameInstance = new ProbableWaffleGameInstance(); gameInstance.players = [player];
  const scene = { get players() { return gameInstance.players; }, baseGameData: { gameInstance } } as ProbableWaffleScene;
  const actor = { scene, emit: jest.fn() } as unknown as Phaser.GameObjects.GameObject;
  const owner = new OwnerComponent(actor, { color: [] }), facts: AiRuntimeProductionFactV1[] = [];
  const coverage = new AiRuntimeResourceCoverageCapture(0, () => ({ tick: 0, captureSequence: facts.length }));
  const journal = new AiRuntimeRecipientResourceCapture(scene, coverage,
    (playerNumber) => ({ playerNumber, tick: 0, sequence: 0 }), () => facts.length,
    (fact) => facts.push({ ...fact, sequence: facts.length + 1 }));
  return { scene, actor, owner, player, coverage, journal, facts };
}

describe("passive owner resource history boundary (final gate pending)", () => {
  beforeEach(() => { jest.clearAllMocks(); jest.mocked(getSceneService).mockReturnValue(undefined); });

  it("loses history before index lookup/update or reentrant reads, even for an actor outside installed cohorts", () => {
    const f = fixture();
    expect(f.coverage.read().cohorts).toEqual([]);
    jest.mocked(getSceneService).mockImplementation(() => {
      expect(f.coverage.read()).toMatchObject({ lost: true, losses: ["resource_actor_owner_change"] });
      return { updateActorOwnership: () => {
        expect(f.owner.getOwner()).toBeUndefined(); f.journal.reconcile();
        expect(f.coverage.read().lost).toBe(true);
      } } as never;
    });
    f.owner.setOwner(2);
    expect(f.owner.getOwner()).toBe(2);
    expect(f.actor.emit).toHaveBeenCalledWith(OwnerComponent.OwnerChangedEvent, undefined, 2);
    expect(Object.values(f.coverage.read().channels ?? {}).every((value) => value === "partial")).toBe(true);
    f.journal.dispose();
  });

  it("does not lose history for undefined restore or a same-owner no-op; defined restore, clear and blink delegate", () => {
    const f = fixture();
    f.owner.setData({ ownerId: undefined }); f.owner.setOwner(undefined);
    expect(f.coverage.read().lost).toBe(false);
    f.owner.setData({ ownerId: 2 }); const epoch = f.coverage.read().lossEpoch;
    f.owner.setOwner(2); f.owner.setData({ ownerId: 2 }); f.owner.setOwnerWithBlink(2);
    expect(f.coverage.read().lossEpoch).toBe(epoch);
    f.owner.clearOwner(); f.owner.setOwnerWithBlink(3);
    expect(f.coverage.read().lossEpoch).toBe(epoch + 2);
    f.journal.dispose();
  });

  it("retains original index error and owner with loss already sticky", () => {
    const f = fixture(), error = new Error("index");
    jest.mocked(getSceneService).mockReturnValue({ updateActorOwnership: () => { throw error; } } as never);
    expect(() => f.owner.setOwner(2)).toThrow(error);
    expect(f.owner.getOwner()).toBeUndefined(); expect(f.actor.emit).not.toHaveBeenCalled();
    expect(f.coverage.read().losses).toContain("resource_actor_owner_change");
    f.journal.dispose();
  });

  it("preserves nested index conversion order with loss before both writes", () => {
    const f = fixture(), updates: Array<[number | undefined, number | undefined]> = [];
    let nested = false;
    jest.mocked(getSceneService).mockReturnValue({ updateActorOwnership: (_actor: unknown, old?: number, next?: number) => {
      expect(f.coverage.read().lost).toBe(true); updates.push([old, next]);
      if (!nested) { nested = true; f.owner.setOwner(3); }
    } } as never);
    f.owner.setOwner(2);
    expect(updates).toEqual([[undefined, 2], [undefined, 3]]);
    expect(f.actor.emit).toHaveBeenNthCalledWith(1, OwnerComponent.OwnerChangedEvent, undefined, 3);
    expect(f.actor.emit).toHaveBeenNthCalledWith(2, OwnerComponent.OwnerChangedEvent, undefined, 2);
    expect(f.owner.getOwner()).toBe(2); expect(f.coverage.read().lossEpoch).toBe(2);
    f.journal.dispose();
  });

  it("isolates observer throws and removes capture subscribers on disposal without changing native ownership", () => {
    const f = fixture(), remove = subscribeSceneResourceLoss(f.scene, () => { throw new Error("observer"); });
    f.owner.setOwner(2); expect(f.owner.getOwner()).toBe(2); remove();
    f.player.addResources({ wood: 3 });
    expect(f.facts.at(-1)).toMatchObject({ mutation: { phase: "returned", lossEpoch: 1 } });
    f.journal.dispose(); const disposed = f.coverage.read(), count = f.facts.length;
    f.owner.setOwner(3); f.player.addResources({ wood: 1 });
    expect(f.owner.getOwner()).toBe(3); expect(f.coverage.read()).toEqual(disposed); expect(f.facts).toHaveLength(count);
  });

  it("keeps fresh installation partial and never backfills the disposed capture", () => {
    const f = fixture(); f.owner.setOwner(2); f.journal.dispose();
    const old = f.coverage.read();
    const coverage = new AiRuntimeResourceCoverageCapture(0, () => ({ tick: 0, captureSequence: 0 }));
    const journal = new AiRuntimeRecipientResourceCapture(f.scene, coverage,
      (playerNumber) => ({ playerNumber, tick: 0, sequence: 0 }), () => 0, () => undefined);
    expect(coverage.read()).toMatchObject({ lost: false, cohorts: [], channels: { selectedNeedLifecycle: "partial" } });
    f.owner.setOwner(3); expect(coverage.read().losses).toContain("resource_actor_owner_change");
    expect(f.coverage.read()).toEqual(old); journal.dispose();
  });
});
