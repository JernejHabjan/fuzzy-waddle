import { Observable, Subject, Subscription } from 'rxjs';
import { Socket } from 'ngx-socket-io';
import { CommunicatorEvent, CommunicatorType } from '@fuzzy-waddle/api-interfaces';

export class TwoWayCommunicator<T> {
  private onSubject: Subject<T> = new Subject<T>();
  private sendSubject: Subject<T> = new Subject<T>();
  private sendLocallySubject: Subject<T> = new Subject<T>();
  private subscriptions: Subscription[] = [];

  constructor(
    private readonly eventName: string,
    private readonly communicator: CommunicatorType,
    gameInstanceId: string,
    socket?: Socket
  ) {
    this.listenToCommunication(eventName, gameInstanceId, socket);
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
   * Starts communication between listeners.
   * if socket is provided, it will also listen to the server
   * otherwise, it will only listen to the UI and Game events and send them to each other
   */
  private listenToCommunication(eventName: string, gameInstanceId: string, socket?: Socket): void {
    // send from UI->Game or Game->UI
    this.subscriptions.push(
      this.sendLocallySubject.subscribe((event) => {
        this.onSubject.next(event);
      })
    );

    // send from UI/Game to server
    this.subscriptions.push(
      this.sendSubject.subscribe((data) => {
        socket?.emit(eventName, {
          gameInstanceId,
          communicator: this.communicator,
          data: data
        } as CommunicatorEvent<T>);
      })
    );

    // listen from server
    if (socket) {
      this.subscriptions.push(
        socket.fromEvent<CommunicatorEvent<T>>(eventName).subscribe((event) => {
          if (event.communicator !== this.communicator) return;
          this.onSubject.next(event.data);
        })
      );
    }
  }
}
