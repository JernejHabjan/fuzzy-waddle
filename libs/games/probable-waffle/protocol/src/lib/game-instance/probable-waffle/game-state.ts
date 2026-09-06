import { BaseGameState } from "@fuzzy-waddle/platform-game-sessions";
import type { BaseData } from "@fuzzy-waddle/platform-game-sessions";
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
  ScenarioActorReferenceData,
  SpellComponentData,
  StatusEffectComponentData,
  VisionComponentData,
  NavigableComponentData
} from "./component-data";
import type { AoeZoneData } from "../../probable-waffle/spell";
import type { PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type {
  CampaignMissionRuntimeState,
  CampaignRestoreInvariantReport
} from "../../probable-waffle/campaign-runtime";
import type { DeterministicRandomState } from "../../probable-waffle/deterministic-random";
import type { GameCommandAuthorityState } from "./game-command";

/** Save-safe lifetime for a spell-created actor. */
export interface SummonExpiryData {
  readonly actorId: string;
  readonly effectId: string;
  readonly commandId: string;
  readonly dueTick: number;
}

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

/**
 * Defines the structured probable waffle game state data contract for this module. Its declared surface makes
 * actors, pause, score, score data, score snapshots explicit to every consumer. Use this shared shape rather
 * than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface ProbableWaffleGameStateData extends BaseData {
  /**
   * collection value on {@link ProbableWaffleGameStateData}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  actors: ActorDefinition[];
  /**
   * pause value carried by {@link ProbableWaffleGameStateData}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  pause: boolean;
  /**
   * numeric score carried by {@link ProbableWaffleGameStateData}. Its units and valid range are defined by
   * {@link ProbableWaffleGameStateData} and must remain consistent across producers and consumers.
   */
  score: number;
  /**
   * Optional score data value carried by {@link ProbableWaffleGameStateData}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  scoreData?: Map<PlayerNumber, PlayerScoreData>;
  /**
   * Optional collection value on {@link ProbableWaffleGameStateData}. Its element type defines the records that
   * may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  scoreSnapshots?: GameScoreSnapshot[];
  /** Documents the aoe zones member and its declared contract at this boundary. */
  aoeZones?: AoeZoneData[];
  /** Documents the player research member and its declared contract at this boundary. */
  playerResearch?: Record<PlayerNumber, string[]>;
  /** Documents the campaign mission member and its declared contract at this boundary. */
  campaignMission?: CampaignMissionRuntimeState;
  /** Documents the campaign restore member and its declared contract at this boundary. */
  campaignRestore?: CampaignRestoreInvariantReport;
  /** Documents the random state member and its declared contract at this boundary. */
  randomState?: DeterministicRandomState;
  /** Command deduplication/authority frontier used across save and host recovery. */
  commandAuthority?: GameCommandAuthorityState;
  /** Spell-created actor expiries evaluated against simulation ticks. */
  summonExpiries?: SummonExpiryData[];
}

/**
 * Defines the structured actor definition contract for this module. Its declared surface makes name, owner,
 * id, scenario explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface ActorDefinition {
  [key: string]: unknown;
  /**
   * Optional human-facing name for {@link ActorDefinition}. It supports UI, narration, or diagnostics and must
   * not be used as the stable identity of the record.
   */
  name?: ObjectNames;
  /**
   * Optional owner value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary for
   * producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  owner?: Partial<OwnerComponentData>;
  /**
   * Optional stable id used by {@link ActorDefinition} to correlate this value with related records, events, or
   * authored content; it is not a display label.
   */
  id?: Partial<IdComponentData>;
  /**
   * Optional scenario value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  scenario?: ScenarioActorReferenceData;
  /**
   * Optional health value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  health?: Partial<HealthComponentData>;
  /**
   * Optional housing value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  housing?: Partial<HousingComponentData>;
  /**
   * Optional construction site value carried by {@link ActorDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  constructionSite?: Partial<ConstructionSiteComponentData>;
  /**
   * Optional selected value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  selected?: Partial<SelectableComponentData>;
  /**
   * Optional vision value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  vision?: Partial<VisionComponentData>;
  /**
   * Optional attack value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  attack?: Partial<AttackComponentData>;
  /**
   * Optional healing value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  healing?: Partial<HealingComponentData>;
  /**
   * Optional builder value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  builder?: Partial<BuilderComponentData>;
  /**
   * Optional gatherer value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  gatherer?: Partial<GathererComponentData>;
  /**
   * Optional container value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  container?: Partial<ContainerComponentData>;
  /**
   * Optional resource drain value carried by {@link ActorDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  resourceDrain?: Partial<ResourceDrainComponentData>;
  /**
   * Optional resource source value carried by {@link ActorDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  resourceSource?: Partial<ResourceSourceComponentData>;
  /**
   * Optional production value carried by {@link ActorDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  production?: Partial<ProductionComponentData>;
  /**
   * Optional research value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  research?: Partial<ResearchComponentData>;
  /**
   * Optional translatable value carried by {@link ActorDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  translatable?: Partial<ActorTranslateComponentData>;
  /**
   * Optional navigable value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  navigable?: Partial<NavigableComponentData>;
  /**
   * Optional representable value carried by {@link ActorDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  representable?: Partial<RepresentableComponentData>;
  /**
   * Optional blackboard value carried by {@link ActorDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  blackboard?: Partial<BackboardComponentData>;
  /**
   * Optional convertible value carried by {@link ActorDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  convertible?: Partial<ConvertibleComponentData>;
  /**
   * Optional spell value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary for
   * producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  spell?: Partial<SpellComponentData>;
  /**
   * Optional status effects value carried by {@link ActorDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  statusEffects?: Partial<StatusEffectComponentData>;
  /**
   * Optional level value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary for
   * producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  level?: Partial<LevelComponentData>;
}
