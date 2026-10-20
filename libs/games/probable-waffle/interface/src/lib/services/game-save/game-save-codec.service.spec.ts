import { webcrypto } from "node:crypto";
import { TestBed } from "@angular/core/testing";
import {
  ObjectNames, ProbableWaffleGameInstance, ProbableWaffleGameState, ProbableWafflePlayer,
  ProbableWafflePlayerController, ProbableWafflePlayerState, type ProbableWaffleGameInstanceData,
  ResearchType, type SharedQueueSnapshotData
} from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiProductionPolicyFixture } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-production-policy-fixture";
import { aiDeadline } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/contracts/ai-core-types";
import { GameSaveCodecService } from "./game-save-codec.service";

describe("GameSaveCodecService", () => {
  const originalCrypto = Object.getOwnPropertyDescriptor(globalThis, "crypto");

  beforeAll(() => {
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: webcrypto as unknown as Crypto
    });
  });

  afterAll(() => {
    if (originalCrypto) {
      Object.defineProperty(globalThis, "crypto", originalCrypto);
    }
  });

  it("round-trips game instance data", async () => {
    const service = TestBed.inject(GameSaveCodecService);
    const data = { players: [] } as unknown as ProbableWaffleGameInstanceData;

    const encoded = await service.encode(data);

    await expect(service.decode(encoded)).resolves.toEqual(data);
  });

  it("retains original AI failure age, leases, retry debt, epoch, RNG and full mixed queue metadata through the real codec", async () => {
    const { state } = createAiProductionPolicyFixture();
    const brain = { ...state, lastCommittedTick: 1999, authority: { ...state.authority,
      authorityEpoch: 4, pendingCommandIds: ["purchase"], reconciliationDeadline: aiDeadline(2001) },
      reservations: [{ claimId: "claim:original" as const, ownerPlanId: "plan:opening" as const, createdTick: 1500,
        state: { kind: "provisional" as const, expiresAt: aiDeadline(2000) }, prerequisites: [],
        priority: { urgencyClass: 2, utility: 850 } }],
      scheduler: { ...state.scheduler, decisionSequence: 17, rngState: [23, 7], boundaryFaults: [{
        owner: "optional", failures: 3, lastFailureTick: 1950, retryAtTick: 2030,
        reason: "technical_fault:Error", recoveredTick: null }] },
      blockers: [{ blockerId: "blocker:original" as const, planId: "plan:opening" as const,
        cause: "resource" as const, causeId: "wood", enteredTick: 1400, deadline: aiDeadline(2000), status: "waiting" as const }] };
    const sharedQueue = { schemaVersion: 1, queues: [[{
      type: "Production", totalTime: 1000, remainingTime: 400,
      productionData: { actorName: ObjectNames.TivaraWorkerMale,
        costData: { costType: 0, productionTime: 1000, resources: { food: 37, wood: 2 }, refundFactor: 0.5 } },
      commandContext: { playerNumber: 2, actorIds: ["producer"], execution: { schemaVersion: 1,
        commandId: "purchase", commitmentKey: "worker", source: "ai", authorityEpoch: 4, sequence: 17,
        intentId: "train", effectId: "worker-effect" } }
    }, { type: "Research", researchData: ResearchType.SnowstormSpell, totalTime: 500, remainingTime: 0,
      researchCost: { resources: { minerals: 13 }, refundFactor: 0.25 } }], []] } satisfies SharedQueueSnapshotData;
    const game = new ProbableWaffleGameInstance();
    game.gameState = new ProbableWaffleGameState({ actors: [{ name: ObjectNames.Sandhold, sharedQueue }],
      pause: false, score: 0, simulationTick: 1999 });
    const player = new ProbableWafflePlayer(new ProbableWafflePlayerState(), new ProbableWafflePlayerController());
    player.playerState.data.aiBehaviorTreeState = { brainState: brain, controllerCadence: { schemaVersion: 1,
      elapsedMilliseconds: 50, queuedAfterBoundary: true, completedDecisionSequence: 17 } };
    game.players = [player];
    const codec = TestBed.inject(GameSaveCodecService);
    const encoded = await codec.encode(game.data);
    const restored = new ProbableWaffleGameInstance(await codec.decode(encoded));
    expect(restored.gameState?.data.simulationTick).toBe(1999);
    expect(restored.gameState?.data.actors[0].sharedQueue).toEqual(sharedQueue);
    expect(restored.players[0].playerState.data.aiBehaviorTreeState).toEqual(player.playerState.data.aiBehaviorTreeState);
  });
});
