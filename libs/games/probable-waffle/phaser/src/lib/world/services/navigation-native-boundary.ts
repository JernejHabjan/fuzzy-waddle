/** Scene-local native milestones. Null as a whole means bounded diagnostic loss; none are saved or replicated. */
export interface NavigationNativeBoundary {
  /** Incremented only after setup, distance invalidation and both native cache clears return successfully. */
  readonly completedRebuild: number;
  /** True from entry to updateNavigation until successful completion, including a failed partial rebuild. */
  readonly rebuildInProgress: boolean;
  /** Completed EasyStar configurations; water configuration is independent of ground object rebuilds. */
  readonly groundConfiguration: number;
  readonly waterConfiguration: number;
  /** Actual explicit cache clears, including water setup and ground shutdown. TTL cleanup is not a clear. */
  readonly groundCacheClear: number;
  readonly waterCacheClear: number;
}
