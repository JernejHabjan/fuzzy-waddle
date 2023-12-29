import { ComponentFixture, TestBed } from "@angular/core/testing";

import { GameInterfaceComponent } from "./game-interface.component";
import { LittleMuncherGameInstance } from "@fuzzy-waddle/api-interfaces";
import { ModalTestComponent } from "../../../shared/components/modal/modal.component.spec";
import { Component } from "@angular/core";
import { WrapPipe } from "./wrap.pipe";
import { AuthService } from "../../../auth/auth.service";
import { authServiceStub } from "../../../auth/auth.service.spec";
import { GameInstanceClientService } from "../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../communicators/game-instance-client.service.spec";

@Component({ selector: "little-muncher-game-interface", template: "" })
export class GameInterfaceTestingComponent {}

describe("GameInterfaceComponent", () => {
  let component: GameInterfaceComponent;
  let fixture: ComponentFixture<GameInterfaceComponent>;

  beforeEach(async () => {
    // provide also WrapPipe
    await TestBed.configureTestingModule({
      declarations: [GameInterfaceComponent, ModalTestComponent, WrapPipe],
      providers: [
        { provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub },
        { provide: AuthService, useValue: authServiceStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GameInterfaceComponent);
    component = fixture.componentInstance;

    // set empty game instance
    const gameInstanceClientService = fixture.debugElement.injector.get(GameInstanceClientService);
    gameInstanceClientService.gameInstance = new LittleMuncherGameInstance();

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
