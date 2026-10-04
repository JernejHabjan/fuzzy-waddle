import { Subject } from "rxjs";

/**
 * Framework-independent event emitter for gameplay code.
 *
 * It preserves the small `emit`/`subscribe` surface previously supplied by
 * Angular's EventEmitter without coupling Phaser projects to Angular.
 */
export class GameEventEmitter<T> extends Subject<T> {
  emit(value: T): void {
    this.next(value);
  }
}
