import { validate } from "class-validator";
import { asSocialUserId } from "../../social/social-identifiers";
import { FindSocialUserQueryDto, SocialUserTargetBodyDto } from "./social-http.dto";

describe("social HTTP DTOs", () => {
  it("accepts an exact username query within the profile contract", async () => {
    const query = Object.assign(new FindSocialUserQueryDto(), { username: "target_user" });

    await expect(validate(query)).resolves.toEqual([]);
  });

  it("rejects malformed target identifiers", async () => {
    const body = Object.assign(new SocialUserTargetBodyDto(), { targetUserId: asSocialUserId("not-a-uuid") });

    await expect(validate(body)).resolves.not.toEqual([]);
  });
});
