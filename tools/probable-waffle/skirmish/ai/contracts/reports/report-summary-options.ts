/** Bounded presentation options; no setting changes a stored scenario verdict. */
export interface ReportSummaryOptions {
  path?: string;
  scenario?: string | null;
  details?: boolean;
  failuresOnly?: boolean;
  maxBytes?: number | null;
}
