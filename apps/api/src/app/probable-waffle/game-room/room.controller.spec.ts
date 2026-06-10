import { Test, TestingModule } from "@nestjs/testing";
import { RoomController } from "./room.controller";
import { RoomServerService } from "./room-server.service";
import { roomServerServiceStub } from "./room-server.service.stub";
import { OnlineAccessGuard } from "../../../auth/guards/online-access.guard";
import { SupabaseAuthGuard } from "../../../auth/guards/supabase-auth.guard";
import { UserProfilesService } from "../../user-profiles/user-profiles.service";
import { onlineAccessGuardStub } from "../../../auth/guards/online-access.guard.stub";
import { supabaseAuthGuardStub } from "../../../auth/guards/supabase-auth.guard.stub";
import { userProfilesServiceStub } from "../../user-profiles/user-profiles.service.stub";

describe("RoomController", () => {
  let controller: RoomController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomController],
      providers: [
        { provide: RoomServerService, useValue: roomServerServiceStub },
        { provide: OnlineAccessGuard, useValue: onlineAccessGuardStub },
        { provide: SupabaseAuthGuard, useValue: supabaseAuthGuardStub },
        { provide: UserProfilesService, useValue: userProfilesServiceStub }
      ]
    }).compile();

    controller = module.get<RoomController>(RoomController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
