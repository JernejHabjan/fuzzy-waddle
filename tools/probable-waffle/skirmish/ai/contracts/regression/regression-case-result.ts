/** Process and native evidence are recorded separately; missing output cannot become a pass. */
export interface RegressionCaseResult {
  caseId: string;
  scenarioId?: string;
  variantId?: string;
  status: string;
  error?: string;
  wallMs?: number;
  artifact?: string | null;
  exitCode?: number | null;
  signal?: NodeJS.Signals | null;
  failures?: string[];
}
