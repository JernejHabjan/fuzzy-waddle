import type { MoveCommand } from "./move-command";
import type { ActorActionCommand } from "./actor-action-command";
import type { StopCommand } from "./stop-command";
import type { ProductionCommand } from "./production-command";
import type { CancelProductionCommand } from "./cancel-production-command";
import type { ResearchCommand } from "./research-command";
import type { CancelResearchCommand } from "./cancel-research-command";
import type { ConstructCommand } from "./construct-command";
import type { CastSpellCommand } from "./cast-spell-command";
import type { UnloadCommand } from "./unload-command";
import type { SetRallyPointCommand } from "./set-rally-point-command";
import type { ConcedeCommand } from "./concede-command";
export type GameCommandInput =
  | Omit<MoveCommand, "tick">
  | Omit<ActorActionCommand, "tick">
  | Omit<StopCommand, "tick">
  | Omit<ProductionCommand, "tick">
  | Omit<CancelProductionCommand, "tick">
  | Omit<ResearchCommand, "tick">
  | Omit<CancelResearchCommand, "tick">
  | Omit<ConstructCommand, "tick">
  | Omit<CastSpellCommand, "tick">
  | Omit<UnloadCommand, "tick">
  | Omit<SetRallyPointCommand, "tick">
  | Omit<ConcedeCommand, "tick">;
