import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MainComponent } from "./main.component";
import { GameContainerTestingComponent } from "@fuzzy-waddle/platform-game-host/game-container/game-container.component.spec";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";
import { authServiceStub } from "@fuzzy-waddle/platform-identity/client/auth/auth.service.stub";
import {
  FlySquasherCommunicatorService,
  flySquasherCommunicatorServiceStub
} from "@fuzzy-waddle/fly-squasher-gameplay/fly-squasher-communicator.service";
import { SceneCommunicatorClientService } from "./scene-communicator-client.service";
import { sceneCommunicatorClientServiceStub } from "./scene-communicator-client.service.stub";
import { ModalTestComponent } from "@fuzzy-waddle/platform-game-host/angular/components/modal/modal.component.spec";
import { GameContainerComponent } from "@fuzzy-waddle/platform-game-host/game-container/game-container.component";
import { ModalComponent } from "@fuzzy-waddle/platform-game-host/angular/components/modal/modal.component";
import { ActivatedRoute } from "@angular/router";

jest.mock("@fuzzy-waddle/fly-squasher-gameplay/consts/game-config", () => ({
  flySquasherGameConfig: {}
}));

describe("MainComponent", () => {
  let component: MainComponent;
  let fixture: ComponentFixture<MainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: FlySquasherCommunicatorService, useValue: flySquasherCommunicatorServiceStub },
        { provide: SceneCommunicatorClientService, useValue: sceneCommunicatorClientServiceStub },
        { provide: ActivatedRoute, useValue: {} }
      ],
      imports: [MainComponent]
    })
      .overrideComponent(MainComponent, {
        remove: {
          imports: [ModalComponent, GameContainerComponent],
          providers: [FlySquasherCommunicatorService, SceneCommunicatorClientService]
        },
        add: {
          imports: [ModalTestComponent, GameContainerTestingComponent],
          providers: [
            { provide: FlySquasherCommunicatorService, useValue: flySquasherCommunicatorServiceStub },
            { provide: SceneCommunicatorClientService, useValue: sceneCommunicatorClientServiceStub }
          ]
        }
      })

      .compileComponents();

    fixture = TestBed.createComponent(MainComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("level", "1");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
