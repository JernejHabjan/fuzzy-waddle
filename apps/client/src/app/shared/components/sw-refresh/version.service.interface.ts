import { VersionState } from "./version.service";
import { Signal } from "@angular/core";

export interface VersionServiceInterface {
  versionState: Signal<VersionState>;
  onVersionRefreshClick: () => void;
}
