import { ProbableWaffleGameInstance, ProbableWaffleUserInfo } from "@fuzzy-waddle/api-interfaces";
import { type BaseGameData } from "@fuzzy-waddle/platform-game-host/phaser/game/base-game-data";
import type { ProbableWaffleCommunicatorServiceInterface } from "./ports/probable-waffle-communicator";

export type ProbableWaffleGameData = BaseGameData<
  ProbableWaffleCommunicatorServiceInterface,
  ProbableWaffleGameInstance,
  ProbableWaffleUserInfo
>;
