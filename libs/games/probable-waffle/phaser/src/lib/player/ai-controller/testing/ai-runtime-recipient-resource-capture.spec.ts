import { OwnerComponent } from "../../../entity/components/owner-component";
import { ProbableWaffleGameInstance } from "@fuzzy-waddle/probable-waffle-protocol";
import type Phaser from "phaser";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { ProbableWafflePlayer, ProbableWafflePlayerState, ProbableWafflePlayerController } from
  "@fuzzy-waddle/probable-waffle-protocol";
import { AiRuntimeRecipientResourceCapture } from "./ai-runtime-recipient-resource-capture";
import { AiRuntimeResourceCoverageCapture } from "./ai-runtime-resource-coverage-capture";
import type { AiRuntimeProductionFactV1 } from "./ai-runtime-production-fact-v1";
import { fenceSceneResourceHistory } from "../../../data/scene-resource-observation";
import { readAiRuntimeResourceOperationId } from "./ai-runtime-resource-operation-identity";

jest.mock("../../../entity/components/owner-presentation", () => ({ OwnerPresentation: class {
  attach() {} tryToSetComponents() {} assignOwnerColor() {} setOwnerColorToActor() {} playBlinkEffect() {}
} }));
jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/player-relation", () => ({ arePlayersAllied: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("../../../world/services/ActorIndexSystem", () => ({ ActorIndexSystem: class {} }));

function fixture() {
  const player = new ProbableWafflePlayer(new ProbableWafflePlayerState(), new ProbableWafflePlayerController());
  Object.defineProperty(player, "playerNumber", { value: 2 });
  const gameInstance = new ProbableWaffleGameInstance(); gameInstance.players = [player];
  const scene = { get players() { return gameInstance.players; }, baseGameData: { gameInstance } } as ProbableWaffleScene;
  const facts: AiRuntimeProductionFactV1[] = [];
  const coverage = new AiRuntimeResourceCoverageCapture(0, () => ({ tick: 0, captureSequence: facts.length }));
  const journal = new AiRuntimeRecipientResourceCapture(scene, coverage,
    (playerNumber) => ({ playerNumber, tick: 0, sequence: 0 }), () => facts.length,
    (fact) => facts.push({ ...fact, sequence: facts.length + 1 }));
  return { player, scene, facts, coverage, journal };
}

describe("all-recipient native resource journal", () => {
  it("keeps roster loss sticky after a remove/re-add whose final recipient and balance are identical", () => {
    const f = fixture(), gameInstance = f.scene.baseGameData.gameInstance;
    gameInstance.removePlayerByPlayer(f.player); gameInstance.addPlayer(f.player); f.journal.reconcile();
    expect(f.coverage.read()).toMatchObject({ lost: true, losses: ["recipient_roster_mutation"] });
    f.player.addResources({ wood: 1 });
    expect(f.facts.at(-1)).toMatchObject({ mutation: { phase: "returned", lossEpoch: 2 } });
    f.journal.dispose();
    const old = f.coverage.read();
    gameInstance.removePlayerByPlayer(f.player); gameInstance.addPlayer(f.player);
    expect(f.coverage.read()).toEqual(old);
  });
  it("fences initial actor ownership through the native owner route and retains later exact mutations as diagnostics", () => {
    const f = fixture();
    const actor = { scene: f.scene, emit: jest.fn() } as unknown as Phaser.GameObjects.GameObject;
    const owner = new OwnerComponent(actor, { color: [] });
    owner.setOwner(2); f.player.addResources({ wood: 3 }); f.journal.reconcile();
    expect(f.coverage.read()).toMatchObject({ lost: true, losses: ["resource_actor_owner_change"] });
    expect(f.facts.at(-1)).toMatchObject({ mutation: { phase: "returned", after: { wood: 203 }, lossEpoch: 1 } });
    f.journal.dispose(); const disposed = f.coverage.read(); owner.clearOwner();
    expect(f.coverage.read()).toEqual(disposed);
  });
  it("fences append failures without changing the native mutation or its original error", () => {
    const f = fixture();
    const append = jest.spyOn(f.facts, "push").mockImplementation(() => { throw new Error("append"); });
    f.player.addResources({ wood: 1 });
    expect(f.player.getResources().wood).toBe(201);
    expect(f.coverage.read().losses).toContain("recipient_mutation_listener_failed");
    expect(() => f.player.payAllResources({ wood: 1, food: 201 })).toThrow("Not enough resources");
    expect(f.player.getResources().wood).toBe(200);
    append.mockRestore(); f.journal.dispose();
  });
  it("captures grants/refunds and removals once, detached from mutable native vectors", () => {
    const f = fixture();
    f.player.addResources({ wood: 7 }); f.player.payAllResources({ wood: 7 }); f.player.addResources({ wood: 3 });
    expect(f.facts.map((fact) => fact.kind)).toEqual([
      "recipient_resources_installed", ...Array(6).fill("recipient_resource_mutation")
    ]);
    const first = f.facts[1], terminal = f.facts[2];
    expect(first.kind === "recipient_resource_mutation" && first.mutation).toMatchObject({ operationId: 1, entrySequence: 2 });
    expect(terminal.kind === "recipient_resource_mutation" && terminal.mutation).toMatchObject({
      operationId: 1, phase: "returned", after: { wood: 207 }
    });
    f.journal.reconcile();
    expect(f.coverage.read().lost).toBe(false);
    expect(f.coverage.read().gaps).toContain("resource_recipient_mutable_alias_history_incomplete");
    f.journal.dispose();
    expect(readAiRuntimeResourceOperationId(f.scene, {})).toBeNull();
  });
  it("fences partial throw, alias mismatch, replacement and restore monotonically", () => {
    const f = fixture();
    expect(() => f.player.payAllResources({ wood: 1, food: 201 })).toThrow("Not enough resources");
    expect(f.facts.at(-1)).toMatchObject({ mutation: { phase: "threw", after: { wood: 199 } } });
    f.player.getResources().wood++;
    f.journal.reconcile();
    expect(f.coverage.read().losses).toContain("recipient_unobserved_balance_change");
    f.player.playerState.data.resources = { ...f.player.getResources() };
    f.journal.reconcile();
    expect(f.coverage.read().losses).toContain("recipient_binding_replaced");
    fenceSceneResourceHistory(f.scene, "snapshot_restore_before_write");
    expect(f.coverage.read().losses).toContain("snapshot_restore_before_write");
    f.player.addResources({ wood: 1 });
    expect(f.coverage.read().lost).toBe(true);
    f.journal.dispose();
  });
  it("keeps net-zero alias history explicitly unsupported even when reconciled endpoints match", () => {
    const f = fixture();
    f.player.getResources().wood++; f.player.getResources().wood--;
    f.journal.reconcile();
    expect(f.coverage.read().channels?.recipientNativeMutations).toBe("partial");
    expect(f.coverage.read().gaps).toContain("resource_recipient_mutable_alias_history_incomplete");
    f.journal.dispose();
  });
});
