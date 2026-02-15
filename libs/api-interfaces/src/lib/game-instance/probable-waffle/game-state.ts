import { BaseGameState } from "../game-state";
import type { BaseData } from "../data";
import type {
  ConstructionSiteComponentData,
  HealthComponentData
} from "../../communicators/probable-waffle/communicator-game-events";
import { ObjectNames } from "./object-names";
import type { PlayerScoreData, GameScoreSnapshot } from "./score-data";
import type { PlayerNumber } from "../player/player";
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
  OwnerComponentData,
  ProductionComponentData,
  RepresentableComponentData,
  ResourceDrainComponentData,
  ResourceSourceComponentData,
  SelectableComponentData,
  VisionComponentData,
  WalkableComponentData
} from "./component-data";

export interface ProbableWaffleGameCommand {
  command: string;
  target: any;
  issuedAt: Date;
}

export class ProbableWaffleGameState extends BaseGameState<ProbableWaffleGameStateData> {
  constructor(data?: ProbableWaffleGameStateData) {
    super(data as ProbableWaffleGameStateData);
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
}

export interface ProbableWaffleGameStateData extends BaseData {
  actors: ActorDefinition[];
  pause: boolean;
  score: number;
  scoreData?: Map<PlayerNumber, PlayerScoreData>;
  scoreSnapshots?: GameScoreSnapshot[];
}

export interface ActorDefinition extends Record<string, any> {
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
  translatable?: Partial<ActorTranslateComponentData>;
  walkable?: Partial<WalkableComponentData>;
  representable?: Partial<RepresentableComponentData>;
  blackboard?: Partial<BackboardComponentData>;
  convertible?: Partial<ConvertibleComponentData>;
}
