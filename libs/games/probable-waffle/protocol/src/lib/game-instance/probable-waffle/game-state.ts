import { BaseGameState, type PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type { GameScoreSnapshot, PlayerScoreData, PlayerScoreSnapshot } from "./score-data";
import type { ProbableWaffleGameStateData } from "./game-state-data";
export type { ProbableWaffleGameStateData } from "./game-state-data";
export type { ActorDefinition } from "./actor-definition";
export type { SummonExpiryData } from "./summon-expiry-data";

export class ProbableWaffleGameState extends BaseGameState<ProbableWaffleGameStateData> {
  constructor(data?: ProbableWaffleGameStateData) {
    super(ProbableWaffleGameState.normalizeData(data) as ProbableWaffleGameStateData);
  }

  override resetData() {
    super.resetData();
    this.data = {
      actors: [],
      score: 0,
      pause: false,
      scoreData: new Map(),
      scoreSnapshots: []
    };
  }

  private static normalizeData(data?: ProbableWaffleGameStateData): ProbableWaffleGameStateData | undefined {
    if (!data) {
      return data;
    }

    return {
      ...data,
      actors: data.actors ?? [],
      score: data.score ?? 0,
      pause: data.pause ?? false,
      scoreData: this.normalizeScoreData(data.scoreData),
      scoreSnapshots: this.normalizeScoreSnapshots(data.scoreSnapshots),
      campaignMission: data.campaignMission ? structuredClone(data.campaignMission) : undefined,
      campaignRestore: data.campaignRestore ? structuredClone(data.campaignRestore) : undefined,
      randomState: data.randomState ? structuredClone(data.randomState) : undefined,
      commandAuthority: data.commandAuthority ? structuredClone(data.commandAuthority) : undefined,
      summonExpiries: data.summonExpiries ? structuredClone(data.summonExpiries) : undefined,
      aoeZones: data.aoeZones ? structuredClone(data.aoeZones) : undefined
    };
  }

  private static normalizeScoreData(
    scoreData:
      | ProbableWaffleGameStateData["scoreData"]
      | PlayerScoreData[]
      | Array<[PlayerNumber, PlayerScoreData]>
      | Record<string, PlayerScoreData>
  ): Map<PlayerNumber, PlayerScoreData> {
    if (scoreData instanceof Map) {
      return scoreData;
    }

    if (!scoreData) {
      return new Map<PlayerNumber, PlayerScoreData>();
    }

    if (Array.isArray(scoreData)) {
      if (
        scoreData.every((entry): entry is [PlayerNumber, PlayerScoreData] => Array.isArray(entry) && entry.length === 2)
      ) {
        return new Map<PlayerNumber, PlayerScoreData>(scoreData);
      }

      return new Map<PlayerNumber, PlayerScoreData>(
        scoreData
          .filter((entry): entry is PlayerScoreData => !!entry && typeof entry.playerNumber === "number")
          .map((entry) => [entry.playerNumber, entry] as const)
      );
    }

    return new Map<PlayerNumber, PlayerScoreData>(
      Object.entries(scoreData).map(([playerNumber, playerScore]) => [Number(playerNumber), playerScore] as const)
    );
  }

  private static normalizeScoreSnapshots(
    scoreSnapshots: ProbableWaffleGameStateData["scoreSnapshots"]
  ): GameScoreSnapshot[] {
    if (!scoreSnapshots) {
      return [];
    }

    return scoreSnapshots.map((snapshot) => ({
      ...snapshot,
      playerScores: this.normalizePlayerScores(snapshot.playerScores)
    }));
  }

  private static normalizePlayerScores(
    playerScores:
      | GameScoreSnapshot["playerScores"]
      | Array<PlayerScoreSnapshot & { playerNumber: number }>
      | Array<[PlayerNumber, PlayerScoreSnapshot]>
      | Record<string, PlayerScoreSnapshot>
  ): Map<PlayerNumber, PlayerScoreSnapshot> {
    if (playerScores instanceof Map) {
      return playerScores;
    }

    if (!playerScores) {
      return new Map<PlayerNumber, PlayerScoreSnapshot>();
    }

    if (Array.isArray(playerScores)) {
      if (
        playerScores.every(
          (entry): entry is [PlayerNumber, PlayerScoreSnapshot] => Array.isArray(entry) && entry.length === 2
        )
      ) {
        return new Map<PlayerNumber, PlayerScoreSnapshot>(playerScores);
      }

      return new Map<PlayerNumber, PlayerScoreSnapshot>(
        playerScores
          .filter(
            (entry): entry is PlayerScoreSnapshot & { playerNumber: number } =>
              !!entry && typeof entry.playerNumber === "number"
          )
          .map(({ playerNumber, ...snapshot }) => [playerNumber, snapshot] as const)
      );
    }

    return new Map<PlayerNumber, PlayerScoreSnapshot>(
      Object.entries(playerScores).map(([playerNumber, snapshot]) => [Number(playerNumber), snapshot] as const)
    );
  }
}
