import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { AtlasFrame } from '../../gui/game-interface/editor-drawer/atlas-loader.service';

// for communication of selected sprite atlas in gui to scene
export interface AtlasEmitValue {
  tilesetName: string;
  atlasFrame: AtlasFrame;
}

// for communication of selection between GUI and Scene
export interface GameObjectSelection {
  name: string; // todo this needs to change!!!
}

export class SceneCommunicatorService {
  static DEFAULT_LAYER = 0;
  static DEFAULT_TILE_REPLACE = 1;

  static atlasEmitterSubject: Subject<AtlasEmitValue | null>;
  static tileEmitterSubject: Subject<number | null>;
  static tileEmitterNrSubject: BehaviorSubject<number>;
  static layerEmitterSubject: BehaviorSubject<number>;
  static selectionChangedSubject: Subject<GameObjectSelection[]> = new Subject<GameObjectSelection[]>();

  private static subscriptions: Subscription[] = [];

  static addSubscription(...sub: Subscription[]) {
    SceneCommunicatorService.subscriptions.push(...sub);
  }

  static setup() {
    SceneCommunicatorService.unsubscribe();
    SceneCommunicatorService.tileEmitterSubject = new Subject<number | null>();
    SceneCommunicatorService.atlasEmitterSubject = new Subject<AtlasEmitValue | null>();
    SceneCommunicatorService.tileEmitterNrSubject = new BehaviorSubject<number>(
      SceneCommunicatorService.DEFAULT_TILE_REPLACE
    );
    SceneCommunicatorService.layerEmitterSubject = new BehaviorSubject<number>(SceneCommunicatorService.DEFAULT_LAYER);
  }

  static unsubscribe() {
    for (const sub of SceneCommunicatorService.subscriptions) {
      sub.unsubscribe();
    }
    SceneCommunicatorService.subscriptions = [];
  }
}
