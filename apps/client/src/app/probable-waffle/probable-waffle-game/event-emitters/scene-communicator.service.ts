import { BehaviorSubject, Subject, Subscription } from 'rxjs';

export class SceneCommunicatorService {
  static testEmitterSubject: BehaviorSubject<number>;
  static tileEmitterSubject: Subject<number|null>;
  static tileEmitterNrSubject:BehaviorSubject<number>

  static subscriptions: Subscription[] = [];

  static setup() {
    // todo make sure this is the right way to setup event emitters
    SceneCommunicatorService.unsubscribe();
    SceneCommunicatorService.testEmitterSubject = new BehaviorSubject<number>(
      1
    );
    SceneCommunicatorService.tileEmitterSubject = new Subject<number|null>();
    SceneCommunicatorService.tileEmitterNrSubject = new BehaviorSubject<number>(1);
  }

  static unsubscribe() {
    // todo make sure everything unsubscribes
    for (const sub of SceneCommunicatorService.subscriptions) {
      sub.unsubscribe();
    }
    SceneCommunicatorService.subscriptions = [];
  }
}
