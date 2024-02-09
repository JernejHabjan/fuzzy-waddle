import { ProbableWaffleGameInstance, ProbableWaffleUserInfo } from "@fuzzy-waddle/api-interfaces";
import { BaseGameData } from "../../../shared/game/phaser/game/base-game-data";
import { ProbableWaffleCommunicatorService } from "../../communicators/probable-waffle-communicator.service";

export type ProbableWaffleGameData = BaseGameData<
  ProbableWaffleCommunicatorService,
  ProbableWaffleGameInstance,
  ProbableWaffleUserInfo
>;
