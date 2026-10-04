import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from "@nestjs/common";
import type { AuthUser } from "@supabase/supabase-js";
import { SocialFriendAction } from "@fuzzy-waddle/platform-database-schema";
import { type FriendRelationship, type PublicSocialProfile, type SocialSnapshot } from "../../social/friendship";
import { asFriendshipId, asSocialUserId, type SocialUserId } from "../../social/social-identifiers";
import type { SocialUserTargetDto } from "../../social/social-dtos";
import { SocialRepositoryError } from "./social-repository.error";
import { SocialRepository } from "./social.repository";
import type { SocialServiceInterface } from "./social.service.interface";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** User-facing text for known persistence error codes; the code itself remains available for clients. */
const SOCIAL_ERROR_MESSAGES: Record<string, string> = {
  social_self_action: "You cannot perform this action on yourself",
  social_request_not_inbound: "This friend request is not awaiting your response",
  social_request_not_outbound: "This friend request was not sent by you",
  social_relationship_not_accepted: "You are not friends with this user",
  social_interaction_blocked: "This action is not allowed between these users",
  social_user_unavailable: "This user is not available",
  social_relationship_not_found: "This relationship could not be found"
};

@Injectable()
export class SocialService implements SocialServiceInterface {
  constructor(private readonly repository: SocialRepository) {}

  async findUser(user: AuthUser, username: string): Promise<PublicSocialProfile | null> {
    const normalized = username.trim();
    if (normalized.length < 3 || normalized.length > 30) {
      throw new BadRequestException("Username must contain between 3 and 30 characters");
    }
    return this.execute(() => this.repository.findUserByUsername(this.actorId(user), normalized));
  }

  getSnapshot(user: AuthUser): Promise<SocialSnapshot> {
    return this.execute(() => this.repository.getSnapshot(this.actorId(user)));
  }

  async sendFriendRequest(user: AuthUser, body: SocialUserTargetDto): Promise<FriendRelationship> {
    const relationship = await this.execute(() =>
      this.repository.applyFriendAction(
        this.actorId(user),
        SocialFriendAction.SendRequest,
        this.userId(body.targetUserId)
      )
    );
    if (!relationship) throw new InternalServerErrorException("Friend request did not return a relationship");
    return relationship;
  }

  async acceptFriendRequest(user: AuthUser, relationshipId: string): Promise<FriendRelationship> {
    const relationship = await this.execute(() =>
      this.repository.applyFriendAction(
        this.actorId(user),
        SocialFriendAction.AcceptRequest,
        undefined,
        this.relationshipId(relationshipId)
      )
    );
    if (!relationship) throw new InternalServerErrorException("Accept did not return a relationship");
    return relationship;
  }

  async declineFriendRequest(user: AuthUser, relationshipId: string): Promise<void> {
    await this.mutateRelationship(user, SocialFriendAction.DeclineRequest, relationshipId);
  }

  async cancelFriendRequest(user: AuthUser, relationshipId: string): Promise<void> {
    await this.mutateRelationship(user, SocialFriendAction.CancelRequest, relationshipId);
  }

  async removeFriend(user: AuthUser, relationshipId: string): Promise<void> {
    await this.mutateRelationship(user, SocialFriendAction.RemoveFriend, relationshipId);
  }

  async blockUser(user: AuthUser, body: SocialUserTargetDto): Promise<void> {
    await this.execute(() =>
      this.repository.applyFriendAction(this.actorId(user), SocialFriendAction.Block, this.userId(body.targetUserId))
    );
  }

  async unblockUser(user: AuthUser, targetUserId: string): Promise<void> {
    await this.execute(() =>
      this.repository.applyFriendAction(this.actorId(user), SocialFriendAction.Unblock, this.userId(targetUserId))
    );
  }

  private async mutateRelationship(user: AuthUser, action: SocialFriendAction, relationshipId: string): Promise<void> {
    await this.execute(() =>
      this.repository.applyFriendAction(this.actorId(user), action, undefined, this.relationshipId(relationshipId))
    );
  }

  private actorId(user: AuthUser): SocialUserId {
    return this.userId(user.id);
  }

  private userId(value: string): SocialUserId {
    if (!UUID_PATTERN.test(value)) throw new BadRequestException("A valid target user id is required");
    return asSocialUserId(value);
  }

  private relationshipId(value: string) {
    if (!UUID_PATTERN.test(value)) throw new BadRequestException("A valid relationship id is required");
    return asFriendshipId(value);
  }

  /** Maps database state-machine outcomes to stable HTTP semantics without leaking persistence details. */
  private async execute<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error: unknown) {
      if (!(error instanceof SocialRepositoryError)) throw error;
      const message = SOCIAL_ERROR_MESSAGES[error.code] ?? "Social action could not be completed";
      switch (error.code) {
        case "social_self_action":
        case "social_request_not_inbound":
        case "social_request_not_outbound":
        case "social_relationship_not_accepted":
          throw new BadRequestException({ message, code: error.code });
        case "social_interaction_blocked":
          throw new ForbiddenException({ message, code: error.code });
        case "social_user_unavailable":
        case "social_relationship_not_found":
          throw new NotFoundException({ message, code: error.code });
        default:
          throw new InternalServerErrorException("Social persistence failed");
      }
    }
  }
}
