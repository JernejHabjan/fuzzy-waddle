import { expect, test } from "@playwright/test";
import { nativeWaitingExposureFailures } from "./skirmish-ai-native-waiting-exposure";

function context(reservations: unknown[], before: unknown) {
  return {
    frames: [
      {
        tick: 20,
        decision: { reservations, input: undefined },
        unspentClaimsBeforeSelection: before
      }
    ]
  } as unknown as Parameters<typeof nativeWaitingExposureFailures>[0];
}

test("the first decision does not require a prior-claims snapshot when no cash is waiting", () => {
  expect(
    nativeWaitingExposureFailures(
      context([], {
        resources: null,
        entries: [],
        gaps: ["unspent_selected_decision_missing"]
      })
    )
  ).toEqual([]);
});

test("older provisional cash still requires original input and ownership evidence", () => {
  expect(
    nativeWaitingExposureFailures(
      context(
        [
          {
            state: { kind: "provisional" },
            createdTick: 10,
            subjectKey: "resource:wood"
          }
        ],
        {
          resources: null,
          entries: [],
          gaps: ["unspent_selected_decision_missing"]
        }
      )
    )
  ).toEqual(["resources_waiting_exposure_original_cash_or_ownership_missing"]);
});
