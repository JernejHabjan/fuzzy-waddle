import { Observable, Subject, Subscription } from 'rxjs';
import { Socket } from 'ngx-socket-io';

export class TwoWayCommunicator<T> {
  private onSubject: Subject<T> = new Subject<T>();
  private sendSubject: Subject<T> = new Subject<T>();
  private sendLocallySubject: Subject<T> = new Subject<T>();
  private subscriptions: Subscription[] = [];

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
  listenToCommunication(data: { eventName: string; socket?: Socket }): void {
    // send from UI->Game or Game->UI
    this.subscriptions.push(
      this.sendLocallySubject.subscribe((event) => {
        this.onSubject.next(event);
      })
    );

    // send from UI/Game to server
    this.subscriptions.push(
      this.sendSubject.subscribe((event) => {
        data.socket?.emit(data.eventName, event);
      })
    );
    // listen from server
    if (data.socket) {
      this.subscriptions.push(
        data.socket.fromEvent<T>(data.eventName).subscribe((event) => {
          this.onSubject.next(event);
        })
      );
    }
  }
}
