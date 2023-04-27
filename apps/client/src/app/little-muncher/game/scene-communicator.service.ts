import { Subject, Subscription } from 'rxjs';
import { LittleMuncherSceneCommunicatorKeyEvent } from '@fuzzy-waddle/api-interfaces';

export class SceneCommunicatorService {
  static keyboardSubjectServerToPhaser: Subject<LittleMuncherSceneCommunicatorKeyEvent>;
  static keyboardSubjectPhaserToServer: Subject<LittleMuncherSceneCommunicatorKeyEvent>;

  private static subscriptions: Subscription[] = [];

  static addSubscription(...sub: Subscription[]) {
    SceneCommunicatorService.subscriptions.push(...sub);
  }

  static setup() {
    SceneCommunicatorService.unsubscribe();
    SceneCommunicatorService.keyboardSubjectPhaserToServer = new Subject<LittleMuncherSceneCommunicatorKeyEvent>();
    SceneCommunicatorService.keyboardSubjectServerToPhaser = new Subject<LittleMuncherSceneCommunicatorKeyEvent>();
  }

  static unsubscribe() {
    for (const sub of SceneCommunicatorService.subscriptions) {
      sub.unsubscribe();
    }
    SceneCommunicatorService.subscriptions = [];
  }
}
