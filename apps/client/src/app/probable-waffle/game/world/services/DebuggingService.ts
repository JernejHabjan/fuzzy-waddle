import { BehaviorSubject } from "rxjs";

export class DebuggingService {
  debug: boolean = false;
  debugChanged: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
}
