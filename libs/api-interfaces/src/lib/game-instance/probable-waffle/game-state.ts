import { BaseGameState } from "../game-state";
import { BaseData } from "../data";
import {
  ConstructionSiteComponentData,
  HealthComponentData
} from "../../communicators/probable-waffle/communicator-game-events";

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
  // Constructor name - used to create actor
  name?: string;

  x?: number;
  y?: number;
  z?: number;

  // OwnerComponent
  owner?: number;

  // IdComponent
  id?: string;

  health?: Partial<HealthComponentData>;
  constructionSite?: Partial<ConstructionSiteComponentData>;

  // todo remove?
  selectable?: boolean;

  // TODO OTHERS FOR EXAMPLE PRODUCTION COMPONENT ETC???

  // BlackboardComponent
  blackboardCurrentCommand?: ProbableWaffleGameCommand; // todo this should be filled and used by PawnAiController
  blackboardCommands?: ProbableWaffleGameCommand[];
}
