import type { SocialServiceInterface } from "./social.service.interface";

export const socialServiceStub = {
  findUser: () => Promise.resolve(null),
  getSnapshot: () => Promise.resolve({ relationships: [], blocks: [] }),
  sendFriendRequest: () => Promise.reject(new Error("Not implemented in socialServiceStub")),
  acceptFriendRequest: () => Promise.reject(new Error("Not implemented in socialServiceStub")),
  declineFriendRequest: () => Promise.resolve(),
  cancelFriendRequest: () => Promise.resolve(),
  removeFriend: () => Promise.resolve(),
  blockUser: () => Promise.resolve(),
  unblockUser: () => Promise.resolve()
} satisfies SocialServiceInterface;
