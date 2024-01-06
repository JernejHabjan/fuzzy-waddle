import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MainComponent } from "./main.component";
import { GameContainerTestingComponent } from "../../shared/game/game-container/game-container.component.spec";
import { AuthService } from "../../auth/auth.service";
import { authServiceStub } from "../../auth/auth.service.spec";
import {
  FlySquasherCommunicatorService,
  flySquasherCommunicatorServiceStub
} from "../game/fly-squasher-communicator.service";
import { SceneCommunicatorClientService } from "./scene-communicator-client.service";
import { sceneCommunicatorClientServiceStub } from "./scene-communicator-client.service.spec";
import { ModalTestComponent } from "../../shared/components/modal/modal.component.spec";
import { GameContainerComponent } from "../../shared/game/game-container/game-container.component";
import { ModalComponent } from "../../shared/components/modal/modal.component";

jest.mock("../game/consts/game-config", () => ({
  flySquasherGameConfig: {}
}));

describe("MainComponent", () => {
  let component: MainComponent;
  let fixture: ComponentFixture<MainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalTestComponent, GameContainerTestingComponent],
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: FlySquasherCommunicatorService, useValue: flySquasherCommunicatorServiceStub },
        { provide: SceneCommunicatorClientService, useValue: sceneCommunicatorClientServiceStub }
      ],
      imports: [MainComponent]
    })
      .overrideComponent(MainComponent, {
        remove: {
          imports: [ModalComponent, GameContainerComponent]
        },
        add: {
          imports: [ModalTestComponent, GameContainerTestingComponent]
        }
      })

      .compileComponents();

    fixture = TestBed.createComponent(MainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
