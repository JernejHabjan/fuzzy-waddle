import { Observable } from "rxjs";
import type {
  ProbableWaffleGameInstanceMetadataChangeEvent,
  ProbableWaffleGameModeDataChangeEvent,
  ProbableWaffleGameStateDataChangeEvent,
  ProbableWafflePlayerDataChangeEvent,
  ProbableWaffleSpectatorDataChangeEvent
} from "@fuzzy-waddle/api-interfaces";

export type ProbableWaffleCommunicators = {
  gameInstanceObservable: Observable<ProbableWaffleGameInstanceMetadataChangeEvent>;
  gameModeObservable: Observable<ProbableWaffleGameModeDataChangeEvent>;
  playerObservable: Observable<ProbableWafflePlayerDataChangeEvent>;
  spectatorObservable: Observable<ProbableWaffleSpectatorDataChangeEvent>;
  gameStateObservable: Observable<ProbableWaffleGameStateDataChangeEvent>;
} | null;
