import type { SocialRepositoryInterface } from "./social.repository.interface";

export const socialRepositoryStub = {
  findUserByUsername: () => Promise.resolve(null),
  getSnapshot: () => Promise.resolve({ relationships: [], blocks: [] }),
  applyFriendAction: () => Promise.resolve(null)
} satisfies SocialRepositoryInterface;
