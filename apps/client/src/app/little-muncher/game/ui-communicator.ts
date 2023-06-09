import { Subject } from 'rxjs';

export type UiCommunicatorData = {
  communicator: UiCommunicator;
  maxCharacterHealth: number;
};

export class UiCommunicator {
  setHealth = new Subject<number>();
}
