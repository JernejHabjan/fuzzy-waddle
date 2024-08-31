import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MainComponent } from "./main.component";
import { GameContainerTestingComponent } from "../../shared/game/game-container/game-container.component.spec";
import { AuthService } from "../../auth/auth.service";
import { authServiceStub } from "../../auth/auth.service.spec";
import { GameInterfaceTestingComponent } from "./game-interface/game-interface.component.spec";
import { GameInstanceClientService } from "./communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "./communicators/game-instance-client.service.spec";
import { GameContainerComponent } from "../../shared/game/game-container/game-container.component";
import { GameInterfaceComponent } from "./game-interface/game-interface.component";
import { Component } from "@angular/core";

jest.mock("../game/const/game-config", () => ({
  littleMuncherGameConfig: {}
}));

@Component({ selector: "little-muncher-main", template: "", standalone: true, imports: [] })
export class MainTestingComponent {}

describe("MainComponent", () => {
  let component: MainComponent;
  let fixture: ComponentFixture<MainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainComponent],
      providers: [
        { provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub },
        { provide: AuthService, useValue: authServiceStub }
      ]
    })
      .overrideComponent(MainComponent, {
        remove: {
          imports: [GameContainerComponent, GameInterfaceComponent]
        },
        add: {
          imports: [GameContainerTestingComponent, GameInterfaceTestingComponent]
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
