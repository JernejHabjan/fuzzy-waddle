export class CrossSceneCommunicationService {
  emitter = new Phaser.Events.EventEmitter();

  emit(event: string | symbol, ...args: any[]): void {
    this.emitter.emit(event, ...args);
  }

  on(event: string | symbol, callback: (...args: any[]) => void) {
    this.emitter.on(event, callback);
  }

  off(event: string | symbol, callback: (...args: any[]) => void) {
    this.emitter.off(event, callback);
  }
}
