import { IsString, IsUUID, Length } from "class-validator";
import type { SocialUserId } from "../../social/social-identifiers";
import type { FindSocialUserDto, SocialUserTargetDto } from "../../social/social-dtos";

/** Validated exact-discovery query at the Nest transport boundary. */
export class FindSocialUserQueryDto implements FindSocialUserDto {
  @IsString()
  @Length(3, 30)
  username!: string;
}

/** Validated target for friendship and block commands. */
export class SocialUserTargetBodyDto implements SocialUserTargetDto {
  @IsUUID()
  targetUserId!: SocialUserId;
}
