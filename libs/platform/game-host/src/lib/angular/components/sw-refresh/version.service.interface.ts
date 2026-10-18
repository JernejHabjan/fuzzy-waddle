import { VersionState } from "./version.service";
import { Observable } from "rxjs";

export interface VersionServiceInterface {
  versionState: Observable<VersionState>;
  ready(): Promise<void>;
}
