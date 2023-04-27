import { Observable, Subject, Subscription } from 'rxjs';
import { Socket } from 'ngx-socket-io';

export class TwoWayCommunicator<T> {
  private fromServerSubject: Subject<T>;
  private fromGameSubject: Subject<T>;
  private subscriptions: Subscription[] = [];

  constructor() {
    this.fromServerSubject = new Subject<T>();
    this.fromGameSubject = new Subject<T>();
  }

  destroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  get fromServer(): Observable<T> {
    return this.fromServerSubject.asObservable();
  }

  get fromGame(): Observable<T> {
    return this.fromGameSubject.asObservable();
  }

  sendToServer(data: T): void {
    this.fromGameSubject.next(data);
  }

  sendToUi(data: T): void {
    this.fromGameSubject.next(data);
  }

  /**
   * Sends data to the game from the server
   * @param data
   */
  sendToGame(data: T): void {
    this.fromServerSubject.next(data);
  }

  /**
   * Starts communication between the game and the server (if event is emitted from the game, it will be sent to the server, and vice versa)
   * @param socket
   * @param eventName
   */
  communicateWithServer(socket: Socket, eventName: string): void {
    // send to server
    this.subscriptions.push(this.fromGame.subscribe((event) => socket.emit(eventName, event)));
    // listen from server
    this.subscriptions.push(socket.fromEvent<T>(eventName).subscribe((event) => this.sendToGame(event)));
  }

  /**
   * Starts communication between the game and the UI (if event is emitted from the game, it will be sent to the UI, and vice versa)
   * @param uiObservable - optional observable to send events to the game
   * @returns {Observable<T>}
   */
  communicateWithUi(uiObservable?: Observable<T>): Observable<T> {
    if (uiObservable) {
      this.subscriptions.push(uiObservable.subscribe((event) => this.sendToGame(event)));
    }
    return this.fromGame;
  }
}
