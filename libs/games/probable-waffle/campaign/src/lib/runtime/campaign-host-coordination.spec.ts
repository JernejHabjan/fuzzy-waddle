import { LocalCampaignHostCoordinationPort } from "./campaign-host-coordination";

describe("campaign host coordination port", () => {
  it("lets either participant request a stable save while the current host coordinates it", () => {
    const port = new LocalCampaignHostCoordinationPort();
    expect(port.authorizeSave({ requesterPlayerNumber: 2, kind: "manual", stable: true })).toEqual({
      accepted: true,
      coordinatingHostPlayerNumber: 1
    });
    port.hostMigrated(2);
    expect(port.authorizeSave({ requesterPlayerNumber: 1, kind: "checkpoint", stable: true })).toEqual({
      accepted: true,
      coordinatingHostPlayerNumber: 2
    });
    expect(port.authorizeSave({ requesterPlayerNumber: 1, kind: "manual", stable: false })).toMatchObject({
      accepted: false,
      coordinatingHostPlayerNumber: 2
    });
  });
});
