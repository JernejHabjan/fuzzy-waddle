/** Economy outcomes consumed from existing native resource/decision capture, without injected forecasts. */
export interface RuntimeEconomyContract {
  readonly latestTick: number;
  readonly branch: "aggregate_budget" | "surplus_transfer" | "poor_delivery";
  readonly resourceType: "wood";
  readonly minimumDelivered: number;
  /** Grant-funded cash must not appear as delivered income before the first native receipt. */
  readonly requireZeroIncomeBeforeReceipt: boolean;
}
