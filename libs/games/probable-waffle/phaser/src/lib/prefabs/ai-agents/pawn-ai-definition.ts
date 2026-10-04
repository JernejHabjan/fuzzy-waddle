import { AiType } from "./ai-type";

export interface PawnAiDefinition {
  type: AiType;
  stepInterval?: number;
}
