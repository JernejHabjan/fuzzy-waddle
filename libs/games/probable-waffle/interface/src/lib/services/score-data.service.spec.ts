import { TestBed } from "@angular/core/testing";
import { GameResultStatus } from "@fuzzy-waddle/platform-database-schema";
import type { PlayerScoreData } from "@fuzzy-waddle/probable-waffle-protocol";
import { GameInstanceClientService } from "../communicators/game-instance-client.service";
import { ScoreDataService } from "./score-data.service";

describe("ScoreDataService", () => {
  const lowerScore: PlayerScoreData = {
    playerNumber: 1,
    playerName: "One",
    playerType: "Human",
    factionType: "Tivara",
    gameResult: GameResultStatus.Win,
    eliminated: false,
    finalScore: 100,
    metrics: {}
  };
  const higherScore: PlayerScoreData = { ...lowerScore, playerNumber: 2, playerName: "Two", finalScore: 300 };
  const gameInstanceClientService = {
    gameInstance: {
      gameState: {
        data: {
          scoreData: new Map([
            [1, lowerScore],
            [2, higherScore]
          ]),
          scoreSnapshots: [{ timestamp: 1, playerScores: new Map() }]
        }
      }
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: GameInstanceClientService, useValue: gameInstanceClientService }]
    });
  });

  it("returns players sorted by final score", () => {
    const service = TestBed.inject(ScoreDataService);

    expect(service.getSortedPlayersByScore().map((score) => score.playerName)).toEqual(["Two", "One"]);
  });

  it("returns score snapshots", () => {
    const service = TestBed.inject(ScoreDataService);

    expect(service.getScoreSnapshots()).toHaveLength(1);
  });
});
