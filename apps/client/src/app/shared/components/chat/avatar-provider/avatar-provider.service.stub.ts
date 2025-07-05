import { IAvatarProviderService } from "./avatar-provider.service.interface";

export const avatarProviderServiceStub = {
  getAvatar(seed: string): string {
    return "";
  }
} satisfies IAvatarProviderService;
