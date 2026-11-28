declare const socialUserIdBrand: unique symbol;
declare const friendshipIdBrand: unique symbol;

/** Stable authenticated profile identifier used across social, party, lobby, and queue contracts. */
export type SocialUserId = string & { readonly [socialUserIdBrand]: "SocialUserId" };

/** Stable identifier for one canonical friendship/request row. */
export type FriendshipId = string & { readonly [friendshipIdBrand]: "FriendshipId" };

/** Narrows an authenticated identifier after its transport boundary has validated the UUID representation. */
export const asSocialUserId = (value: string): SocialUserId => value as SocialUserId;

/** Narrows a relationship identifier after its transport boundary has validated the UUID representation. */
export const asFriendshipId = (value: string): FriendshipId => value as FriendshipId;
