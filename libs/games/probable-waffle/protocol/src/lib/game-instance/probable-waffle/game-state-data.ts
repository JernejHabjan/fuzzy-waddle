import type { BaseData, PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type { ActorDefinition } from "./actor-definition";
import type { SummonExpiryData } from "./summon-expiry-data";
import type { GameScoreSnapshot, PlayerScoreData } from "./score-data";
import type { AoeZoneData } from "../../probable-waffle/spell";
import type {
  CampaignMissionRuntimeState,
  CampaignRestoreInvariantReport
} from "../../probable-waffle/campaign-runtime";
import type { DeterministicRandomState } from "../../probable-waffle/deterministic-random";
import type { GameCommandAuthorityState } from "./game-command";

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
