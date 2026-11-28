import type { AuthUser } from "@supabase/supabase-js";
import { asSocialUserId } from "../../social/social-identifiers";
import { SocialController } from "./social.controller";
import { SocialService } from "./social.service";

describe("SocialController", () => {
  const user = { id: "11111111-1111-4111-8111-111111111111" } as AuthUser;
  const targetUserId = asSocialUserId("22222222-2222-4222-8222-222222222222");
  const service = {
    findUser: jest.fn(),
    getSnapshot: jest.fn(),
    sendFriendRequest: jest.fn(),
    acceptFriendRequest: jest.fn(),
    declineFriendRequest: jest.fn(),
    cancelFriendRequest: jest.fn(),
    removeFriend: jest.fn(),
    blockUser: jest.fn(),
    unblockUser: jest.fn()
  };
  const controller = new SocialController(service as unknown as SocialService);

  beforeEach(() => jest.clearAllMocks());

  it("uses only the authenticated user as friendship actor", async () => {
    service.sendFriendRequest.mockResolvedValue({});

    await controller.sendFriendRequest(user, { targetUserId });

    expect(service.sendFriendRequest).toHaveBeenCalledWith(user, { targetUserId });
  });

  it("forwards exact username discovery", async () => {
    service.findUser.mockResolvedValue(null);

    await controller.findUser(user, { username: "Target_User" });

    expect(service.findUser).toHaveBeenCalledWith(user, "Target_User");
  });
});
