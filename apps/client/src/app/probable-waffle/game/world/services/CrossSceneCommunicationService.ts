export class CrossSceneCommunicationService {
  emitter = new Phaser.Events.EventEmitter();

  emit(event: string | symbol, ...args: any[]): void {
    this.emitter.emit(event, ...args);
  }

  on(event: string | symbol, callback: (...args: any[]) => void, context?: any) {
    this.emitter.on(event, callback, context);
  }

  off(event: string | symbol, callback: (...args: any[]) => void, context?: any) {
    this.emitter.off(event, callback, context);
  }
}
