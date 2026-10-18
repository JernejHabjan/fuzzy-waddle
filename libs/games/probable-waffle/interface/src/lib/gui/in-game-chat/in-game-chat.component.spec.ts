import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { ProbableWaffleCommunicatorService } from "../../communicators/probable-waffle-communicator.service";
import { InGameChatComponent } from "./in-game-chat.component";

describe("InGameChatComponent", () => {
  let fixture: ComponentFixture<InGameChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InGameChatComponent],
      providers: [
        { provide: ProbableWaffleCommunicatorService, useValue: { message: undefined } },
        { provide: GameInstanceClientService, useValue: { currentGameInstanceId: "game-1" } },
        { provide: AuthService, useValue: { userId: "user-1" } }
      ]
    })
      .overrideComponent(InGameChatComponent, {
        set: { imports: [], template: "" }
      })
      .compileComponents();

    fixture = TestBed.createComponent(InGameChatComponent);
  });

  it("creates without an active chat channel", () => {
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
