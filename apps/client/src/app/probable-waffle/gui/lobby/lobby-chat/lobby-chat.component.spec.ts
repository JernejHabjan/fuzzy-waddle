import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LobbyChatComponent } from "./lobby-chat.component";
import {
  ProbableWaffleCommunicatorService,
  probableWaffleCommunicatorServiceStub
} from "../../../communicators/probable-waffle-communicator.service";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../../communicators/game-instance-client.service.spec";
import { AuthService } from "../../../../auth/auth.service";
import { authServiceStub } from "../../../../auth/auth.service.spec";

describe("LobbyChatComponent", () => {
  let component: LobbyChatComponent;
  let fixture: ComponentFixture<LobbyChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: ProbableWaffleCommunicatorService, useValue: probableWaffleCommunicatorServiceStub },
        { provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub },
        { provide: AuthService, useValue: authServiceStub }
      ],
      imports: [LobbyChatComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LobbyChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
