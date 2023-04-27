import { Observable, Subject, Subscription } from 'rxjs';
import { Socket } from 'ngx-socket-io';
import { CommunicatorEvent, CommunicatorType } from '@fuzzy-waddle/api-interfaces';

export class TwoWayCommunicator<T> {
  private onSubject: Subject<T> = new Subject<T>();
  private sendSubject: Subject<T> = new Subject<T>();
  private sendLocallySubject: Subject<T> = new Subject<T>();
  private subscriptions: Subscription[] = [];

  constructor(private readonly eventName: string, public readonly communicator: CommunicatorType, socket: Socket) {
    this.listenToCommunication({ eventName, socket });
  }

  destroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  get on(): Observable<T> {
    return this.onSubject.asObservable();
  }

  /**
   * Sends data to the game from the server
   * @param data
   */
  send(data: T): void {
    this.sendSubject.next(data);
    this.sendLocallySubject.next(data);
  }

  /**
   * Starts communication between the game and the server (if event is emitted from the game, it will be sent to the server, and vice versa)
   */
  private listenToCommunication(config: { eventName: string; socket?: Socket }): void {
    // send from UI->Game or Game->UI
    this.subscriptions.push(
      this.sendLocallySubject.subscribe((event) => {
        this.onSubject.next(event);
      })
    );

    // send from UI/Game to server
    this.subscriptions.push(
      this.sendSubject.subscribe((data) => {
        config.socket?.emit(config.eventName, {
          communicator: this.communicator,
          data: data
        } as CommunicatorEvent<T>);
      })
    );
    // listen from server
    if (config.socket) {
      this.subscriptions.push(
        config.socket.fromEvent<CommunicatorEvent<T>>(config.eventName).subscribe((event) => {
          if (event.communicator !== this.communicator) return;
          this.onSubject.next(event.data);
        })
      );
    }
  }
}
