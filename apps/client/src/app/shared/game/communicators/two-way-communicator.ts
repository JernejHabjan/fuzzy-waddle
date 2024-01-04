import { Observable, Subject, Subscription } from "rxjs";
import { Socket } from "ngx-socket-io";
import { CommunicatorEvent } from "@fuzzy-waddle/api-interfaces";

export class TwoWayCommunicator<T, K> {
  private onSubject: Subject<T> = new Subject<T>();
  private sendSubject: Subject<T> = new Subject<T>();
  private sendLocallySubject: Subject<T> = new Subject<T>();
  private subscriptions: Subscription[] = [];

  constructor(
    eventName: string,
    private readonly communicator: K,
    gameInstanceId?: string,
    private readonly socket?: Socket
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
   * Sends data to Server if we're connected to a socket, otherwise manage data locally
   *
   * Note - this sends data locally (so event is seen immediately) and to the server (so event is seen by other players).
   * On server, use socket.emit to send data to other players or socket.to(room).emit to send data to other players in the same room.
   * https://socket.io/docs/v3/emit-cheatsheet/
   */
  send(data: T): void {
    this.sendSubject.next(data);
    this.sendLocallySubject.next(data);
  }

  /**
   * Sends data to UI + Game from Game or UI + Game from UI
   * @param data
   */
  sendLocally(data: T): void {
    this.sendLocallySubject.next(data);
  }

  /**
   * Starts communication between listeners.
   * if socket is provided, it will also listen to the server
   * otherwise, it will only listen to the UI and Game events and send them to each other
   */
  private listenToCommunication(eventName: string, gameInstanceId?: string, socket?: Socket): void {
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
          payload: data
        } satisfies CommunicatorEvent<T, unknown>);
      })
    );

    // listen from server
    if (socket && gameInstanceId) {
      this.subscriptions.push(
        socket.fromEvent<CommunicatorEvent<T, unknown>>(eventName).subscribe((event) => {
          if (event.communicator === undefined) {
            console.error("Communicator received from socket event is undefined", event);
          }
          if (event.communicator !== this.communicator) return;
          this.onSubject.next(event.payload);
        })
      );
    }
  }

  /**
   * Subscribes to the on event and calls stateChanged() when the state changes
   * Pass in valueChange to change the state
   * @param stateChanged
   * @param valueChange
   * @returns {Subscription}
   */
  onWithInitial(stateChanged: () => void, valueChange: (event: T) => void): Subscription {
    stateChanged();
    return this.on.subscribe((event) => {
      valueChange(event);
      stateChanged();
    });
  }

  /**
   * Sends data to the game from the server and calls stateChanged() when the state changes
   * @param data
   * @param stateChanged
   */
  sendWithStateChange(data: T, stateChanged: () => void): void {
    this.send(data);
    stateChanged();
  }
}
