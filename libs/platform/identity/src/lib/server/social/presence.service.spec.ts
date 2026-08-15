import { asSocialUserId } from "../../social/social-identifiers";
import { PresenceState } from "../../social/presence";
import { PRESENCE_RECONNECT_GRACE_MS, PresenceService } from "./presence.service";

describe("PresenceService", () => {
  const userId = asSocialUserId("11111111-1111-4111-8111-111111111111");

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("reports offline for a user with no connections", () => {
    const service = new PresenceService();
    expect(service.getState(userId)).toBe(PresenceState.Offline);
  });

  it("becomes online on the first connection only", () => {
    const service = new PresenceService();
    expect(service.registerConnection(userId)).toBe(true);
    expect(service.getState(userId)).toBe(PresenceState.Online);
    // a second tab/device does not re-trigger an online transition
    expect(service.registerConnection(userId)).toBe(false);
  });

  it("stays online while any connection (multi-tab) remains open", () => {
    const service = new PresenceService();
    const onOffline = jest.fn();
    service.registerConnection(userId);
    service.registerConnection(userId);

    service.deregisterConnection(userId, onOffline);
    jest.advanceTimersByTime(PRESENCE_RECONNECT_GRACE_MS + 1);

    expect(service.getState(userId)).toBe(PresenceState.Online);
    expect(onOffline).not.toHaveBeenCalled();
  });

  it("goes offline only after the reconnect grace window elapses with no reconnect", () => {
    const service = new PresenceService();
    const onOffline = jest.fn();
    service.registerConnection(userId);

    service.deregisterConnection(userId, onOffline);
    expect(service.getState(userId)).toBe(PresenceState.Online);

    jest.advanceTimersByTime(PRESENCE_RECONNECT_GRACE_MS - 1);
    expect(onOffline).not.toHaveBeenCalled();

    jest.advanceTimersByTime(2);
    expect(onOffline).toHaveBeenCalledWith(userId);
    expect(service.getState(userId)).toBe(PresenceState.Offline);
  });

  it("cancels the pending offline transition when the user reconnects within the grace window", () => {
    const service = new PresenceService();
    const onOffline = jest.fn();
    service.registerConnection(userId);

    service.deregisterConnection(userId, onOffline);
    jest.advanceTimersByTime(PRESENCE_RECONNECT_GRACE_MS / 2);
    service.registerConnection(userId);
    jest.advanceTimersByTime(PRESENCE_RECONNECT_GRACE_MS);

    expect(onOffline).not.toHaveBeenCalled();
    expect(service.getState(userId)).toBe(PresenceState.Online);
  });
});
