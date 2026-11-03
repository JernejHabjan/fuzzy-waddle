import { GameCommandOutcomeKinds } from "./game-command-outcome-kinds";
export type GameCommandOutcomeKind = (typeof GameCommandOutcomeKinds)[keyof typeof GameCommandOutcomeKinds];
