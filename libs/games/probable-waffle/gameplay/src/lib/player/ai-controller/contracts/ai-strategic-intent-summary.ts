/** Human-readable explanation projected from one committed AI decision boundary. */
export interface AiStrategicIntentSummary {
  readonly headline: string;
  readonly objective: string;
  readonly force: string;
  readonly production: string;
  readonly economy: string;
  readonly blocker: string | null;
  readonly nextAction: string;
}
