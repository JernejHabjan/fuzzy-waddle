import { Test, TestingModule } from "@nestjs/testing";
import { MatchmakingController } from "./matchmaking.controller";
import { MatchmakingService } from "./matchmaking.service";
import { matchmakingServiceStub } from "./matchmaking.service.stub";
import { OnlineAccessGuard } from "../../../auth/guards/online-access.guard";
import { SupabaseAuthGuard } from "../../../auth/guards/supabase-auth.guard";
import { UserProfilesService } from "../../user-profiles/user-profiles.service";
import { onlineAccessGuardStub } from "../../../auth/guards/online-access.guard.stub";
import { supabaseAuthGuardStub } from "../../../auth/guards/supabase-auth.guard.stub";
import { userProfilesServiceStub } from "../../user-profiles/user-profiles.service.stub";

describe("MatchmakingController", () => {
  let controller: MatchmakingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchmakingController],
      providers: [
        { provide: MatchmakingService, useValue: matchmakingServiceStub },
        { provide: OnlineAccessGuard, useValue: onlineAccessGuardStub },
        { provide: SupabaseAuthGuard, useValue: supabaseAuthGuardStub },
        { provide: UserProfilesService, useValue: userProfilesServiceStub }
      ]
    }).compile();

    controller = module.get<MatchmakingController>(MatchmakingController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
