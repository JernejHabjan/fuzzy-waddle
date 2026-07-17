import { Test, TestingModule } from "@nestjs/testing";
import { FlySquasherController } from "./fly-squasher.controller";
import { FlySquasherService } from "./fly-squasher.service";
import { flySquasherServiceStub } from "./fly-squasher.service.stub";
import { OnlineAccessGuard } from "@fuzzy-waddle/api/auth/guards/online-access.guard";
import { SupabaseAuthGuard } from "@fuzzy-waddle/api/auth/guards/supabase-auth.guard";
import { UserProfilesService } from "@fuzzy-waddle/api/app/user-profiles/user-profiles.service";
import { onlineAccessGuardStub } from "@fuzzy-waddle/api/auth/guards/online-access.guard.stub";
import { supabaseAuthGuardStub } from "@fuzzy-waddle/api/auth/guards/supabase-auth.guard.stub";
import { userProfilesServiceStub } from "@fuzzy-waddle/api/app/user-profiles/user-profiles.service.stub";

describe("FlySquasherController", () => {
  let controller: FlySquasherController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: FlySquasherService, useValue: flySquasherServiceStub },
        { provide: OnlineAccessGuard, useValue: onlineAccessGuardStub },
        { provide: SupabaseAuthGuard, useValue: supabaseAuthGuardStub },
        { provide: UserProfilesService, useValue: userProfilesServiceStub }
      ],
      controllers: [FlySquasherController]
    }).compile();

    controller = module.get<FlySquasherController>(FlySquasherController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
