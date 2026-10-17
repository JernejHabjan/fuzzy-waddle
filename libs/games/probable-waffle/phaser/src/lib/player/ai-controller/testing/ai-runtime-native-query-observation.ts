import type { NavigationService } from "../../../world/services/navigation.service";
import type { NavigationNativeQuery } from "../../../world/services/navigation-native-query";

/** One caller's actual synchronous native lookup. Multiple/nested lookups stay ambiguous instead of selecting one. */
export class AiRuntimeNativeQueryObservation {
  private query: NavigationNativeQuery | null = null;
  private count = 0;
  private disposed = false;

  constructor(private readonly navigation?: NavigationService) {}

  invoke<T>(call: () => T): T {
    if (this.disposed || typeof this.navigation?.observeNativeNavigationQuery !== "function") return call();
    return this.navigation.observeNativeNavigationQuery(call, (query) => {
      if (this.disposed) return;
      this.count = Math.min(2, this.count + 1);
      this.query = this.count === 1 ? query : null;
    });
  }

  /** The native callback writes completion before the outer Promise settles; detach only at the captured terminal. */
  sample(): NavigationNativeQuery | undefined {
    return !this.disposed && this.count === 1 && this.query ? structuredClone(this.query) : undefined;
  }

  dispose(): void {
    this.disposed = true;
    this.query = null;
  }
}
