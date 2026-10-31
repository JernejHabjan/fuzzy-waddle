import { ProbableWaffleGameCommandTypes } from "./probable-waffle-game-command-types";
export type ProbableWaffleGameCommandType =
  (typeof ProbableWaffleGameCommandTypes)[keyof typeof ProbableWaffleGameCommandTypes];
