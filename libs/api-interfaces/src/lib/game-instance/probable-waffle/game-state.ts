import { BaseGameState } from "../game-state";
import type { BaseData } from "../data";
import type {
  ConstructionSiteComponentData,
  HealthComponentData
} from "../../communicators/probable-waffle/communicator-game-events";
import { ObjectNames } from "./object-names";
import type { GameScoreSnapshot, PlayerScoreData, PlayerScoreSnapshot } from "./score-data";
import type {
  ActorTranslateComponentData,
  AttackComponentData,
  BackboardComponentData,
  BuilderComponentData,
  ContainerComponentData,
  ConvertibleComponentData,
  GathererComponentData,
  HealingComponentData,
  HousingComponentData,
  IdComponentData,
  LevelComponentData,
  OwnerComponentData,
  ProductionComponentData,
  RepresentableComponentData,
  ResearchComponentData,
  ResourceDrainComponentData,
  ResourceSourceComponentData,
  SelectableComponentData,
  SpellComponentData,
  StatusEffectComponentData,
  VisionComponentData,
  NavigableComponentData
} from "./component-data";
import type { AoeZoneData } from "../../probable-waffle/spell";
import type { PlayerNumber } from "../player/player";

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
      scoreSnapshots: this.normalizeScoreSnapshots(data.scoreSnapshots)
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

export interface ProbableWaffleGameStateData extends BaseData {
  actors: ActorDefinition[];
  pause: boolean;
  score: number;
  scoreData?: Map<PlayerNumber, PlayerScoreData>;
  scoreSnapshots?: GameScoreSnapshot[];
  /** Active AOE zones for save/load support */
  aoeZones?: AoeZoneData[];
  /** Research state per player for save/load support */
  playerResearch?: Record<PlayerNumber, string[]>;
}

export interface ActorDefinition {
  [key: string]: unknown;
  name?: ObjectNames;
  owner?: Partial<OwnerComponentData>;
  id?: Partial<IdComponentData>;
  health?: Partial<HealthComponentData>;
  housing?: Partial<HousingComponentData>;
  constructionSite?: Partial<ConstructionSiteComponentData>;
  selected?: Partial<SelectableComponentData>;
  vision?: Partial<VisionComponentData>;
  attack?: Partial<AttackComponentData>;
  healing?: Partial<HealingComponentData>;
  builder?: Partial<BuilderComponentData>;
  gatherer?: Partial<GathererComponentData>;
  container?: Partial<ContainerComponentData>;
  resourceDrain?: Partial<ResourceDrainComponentData>;
  resourceSource?: Partial<ResourceSourceComponentData>;
  production?: Partial<ProductionComponentData>;
  research?: Partial<ResearchComponentData>;
  translatable?: Partial<ActorTranslateComponentData>;
  navigable?: Partial<NavigableComponentData>;
  representable?: Partial<RepresentableComponentData>;
  blackboard?: Partial<BackboardComponentData>;
  convertible?: Partial<ConvertibleComponentData>;
  spell?: Partial<SpellComponentData>;
  statusEffects?: Partial<StatusEffectComponentData>;
  level?: Partial<LevelComponentData>;
}
