import { Test, TestingModule } from "@nestjs/testing";
import { GameInstanceController } from "./game-instance.controller";
import { GameInstanceService } from "./game-instance.service";
import { GameInstanceServiceStub } from "./game-instance.service.stub";
import { MatchmakingService } from "../matchmaking/matchmaking.service";
import { matchmakingServiceStub } from "../matchmaking/matchmaking.service.stub";
import { OnlineAccessGuard } from "../../../auth/guards/online-access.guard";
import { SupabaseAuthGuard } from "../../../auth/guards/supabase-auth.guard";
import { UserProfilesService } from "../../user-profiles/user-profiles.service";
import { onlineAccessGuardStub } from "../../../auth/guards/online-access.guard.stub";
import { supabaseAuthGuardStub } from "../../../auth/guards/supabase-auth.guard.stub";
import { userProfilesServiceStub } from "../../user-profiles/user-profiles.service.stub";

describe("GameInstanceController", () => {
  let controller: GameInstanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: GameInstanceService, useValue: GameInstanceServiceStub },
        { provide: MatchmakingService, useValue: matchmakingServiceStub },
        { provide: OnlineAccessGuard, useValue: onlineAccessGuardStub },
        { provide: SupabaseAuthGuard, useValue: supabaseAuthGuardStub },
        { provide: UserProfilesService, useValue: userProfilesServiceStub }
      ],
      controllers: [GameInstanceController]
    }).compile();

    controller = module.get<GameInstanceController>(GameInstanceController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
