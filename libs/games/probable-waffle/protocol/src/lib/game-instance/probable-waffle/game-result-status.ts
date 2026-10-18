export const GameResultStatus = {
  Win: "win",
  Loss: "loss",
  Tie: "tie",
  Quit: "quit"
} as const;

export type GameResultStatus = (typeof GameResultStatus)[keyof typeof GameResultStatus];
