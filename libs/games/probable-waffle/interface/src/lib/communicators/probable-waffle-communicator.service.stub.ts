import { EventEmitter } from "@angular/core";
import type {
  ProbableWaffleCommunicatorServiceInterface,
  ProbableWaffleUtilityEventData
} from "@fuzzy-waddle/probable-waffle-phaser";
import type { AllScenesEventData } from "@fuzzy-waddle/probable-waffle-protocol";

export const probableWaffleCommunicatorServiceStub = {
  allScenes: new EventEmitter<AllScenesEventData>(),
  utilityEvents: new EventEmitter<ProbableWaffleUtilityEventData>(),
  startCommunication: () => {},
  stopCommunication: () => {}
} satisfies ProbableWaffleCommunicatorServiceInterface;
