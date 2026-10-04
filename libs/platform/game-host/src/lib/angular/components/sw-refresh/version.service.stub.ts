import { VersionState } from "./version.service";
import { type VersionServiceInterface } from "./version.service.interface";
import { Observable } from "rxjs";

export const versionServiceStub = {
  get versionState() {
    // return observable
    return new Observable<VersionState>();
  },
  async ready() {
    await Promise.resolve();
  }
} satisfies VersionServiceInterface;
