import { ProbableWaffleGameInstance, ProbableWaffleUserInfo } from "@fuzzy-waddle/api-interfaces";
import { ProbableWaffleCommunicatorService } from "./probable-waffle-communicator.service";
import { BaseGameData } from "../../../shared/game/phaser/game/base-game-data";

export type ProbableWaffleGameData = BaseGameData<
  ProbableWaffleCommunicatorService,
  ProbableWaffleGameInstance,
  ProbableWaffleUserInfo
>;
