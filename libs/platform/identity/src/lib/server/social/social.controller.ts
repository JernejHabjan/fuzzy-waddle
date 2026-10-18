import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from "@nestjs/common";
import type { AuthUser } from "@supabase/supabase-js";
import type { FriendRelationship, PublicSocialProfile, SocialSnapshot } from "../../social/friendship";
import { CurrentUser } from "../auth/current-user";
import { SupabaseAuthGuard } from "../auth/guards/supabase-auth.guard";
import { FindSocialUserQueryDto, SocialUserTargetBodyDto } from "./social-http.dto";
import { SocialService } from "./social.service";

@Controller("social")
@UseGuards(SupabaseAuthGuard)
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get("users")
  findUser(@CurrentUser() user: AuthUser, @Query() query: FindSocialUserQueryDto): Promise<PublicSocialProfile | null> {
    return this.socialService.findUser(user, query.username);
  }

  @Get()
  getSnapshot(@CurrentUser() user: AuthUser): Promise<SocialSnapshot> {
    return this.socialService.getSnapshot(user);
  }

  @Post("friend-requests")
  sendFriendRequest(@CurrentUser() user: AuthUser, @Body() body: SocialUserTargetBodyDto): Promise<FriendRelationship> {
    return this.socialService.sendFriendRequest(user, body);
  }

  @Post("friend-requests/:relationshipId/accept")
  acceptFriendRequest(
    @CurrentUser() user: AuthUser,
    @Param("relationshipId", new ParseUUIDPipe()) relationshipId: string
  ): Promise<FriendRelationship> {
    return this.socialService.acceptFriendRequest(user, relationshipId);
  }

  @Delete("friend-requests/:relationshipId/decline")
  declineFriendRequest(
    @CurrentUser() user: AuthUser,
    @Param("relationshipId", new ParseUUIDPipe()) relationshipId: string
  ): Promise<void> {
    return this.socialService.declineFriendRequest(user, relationshipId);
  }

  @Delete("friend-requests/:relationshipId/cancel")
  cancelFriendRequest(
    @CurrentUser() user: AuthUser,
    @Param("relationshipId", new ParseUUIDPipe()) relationshipId: string
  ): Promise<void> {
    return this.socialService.cancelFriendRequest(user, relationshipId);
  }

  @Delete("friends/:relationshipId")
  removeFriend(
    @CurrentUser() user: AuthUser,
    @Param("relationshipId", new ParseUUIDPipe()) relationshipId: string
  ): Promise<void> {
    return this.socialService.removeFriend(user, relationshipId);
  }

  @Post("blocks")
  blockUser(@CurrentUser() user: AuthUser, @Body() body: SocialUserTargetBodyDto): Promise<void> {
    return this.socialService.blockUser(user, body);
  }

  @Delete("blocks/:targetUserId")
  unblockUser(
    @CurrentUser() user: AuthUser,
    @Param("targetUserId", new ParseUUIDPipe()) targetUserId: string
  ): Promise<void> {
    return this.socialService.unblockUser(user, targetUserId);
  }
}
