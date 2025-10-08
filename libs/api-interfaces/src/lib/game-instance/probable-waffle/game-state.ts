import { BaseGameState } from "../game-state";
import type { BaseData } from "../data";
import type {
  ConstructionSiteComponentData,
  HealthComponentData
} from "../../communicators/probable-waffle/communicator-game-events";
import { ObjectNames } from "./object-names";
import type {
  ActorTranslateComponentData,
  AttackComponentData,
  BackboardComponentData,
  BuilderComponentData,
  ContainerComponentData,
  GathererComponentData,
  HealingComponentData,
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
      pause: false
    };
  }
}

export interface ProbableWaffleGameStateData extends BaseData {
  actors: ActorDefinition[];
  pause: boolean;
  score: number;
}

export interface ActorDefinition extends Record<string, any> {
  name?: ObjectNames;
  owner?: Partial<OwnerComponentData>;
  id?: Partial<IdComponentData>;
  health?: Partial<HealthComponentData>;
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
}
