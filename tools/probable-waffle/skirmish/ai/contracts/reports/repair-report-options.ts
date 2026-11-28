/** Repair-list selection and output limits, independent of scenario execution. */
export interface RepairReportOptions {
  maxClusters?: number | null;
  maxBytes?: number | null;
  expectedIds?: string[];
}
