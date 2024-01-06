import { ComponentFixture, TestBed } from "@angular/core/testing";

import { GameInterfaceComponent } from "./game-interface.component";
import { LittleMuncherGameInstance } from "@fuzzy-waddle/api-interfaces";
import { ModalTestComponent } from "../../../shared/components/modal/modal.component.spec";
import { Component } from "@angular/core";
import { AuthService } from "../../../auth/auth.service";
import { authServiceStub } from "../../../auth/auth.service.spec";
import { GameInstanceClientService } from "../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../communicators/game-instance-client.service.spec";
import { WrapPipeModule } from "../../../shared/pipes/wrap-pipe.module";
import { ModalComponent } from "../../../shared/components/modal/modal.component";
import { CommonModule } from "@angular/common";

@Component({ selector: "little-muncher-game-interface", template: "", standalone: true, imports: [CommonModule] })
export class GameInterfaceTestingComponent {}

describe("GameInterfaceComponent", () => {
  let component: GameInterfaceComponent;
  let fixture: ComponentFixture<GameInterfaceComponent>;

  beforeEach(async () => {
    // provide also WrapPipe
    await TestBed.configureTestingModule({
      providers: [
        { provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub },
        { provide: AuthService, useValue: authServiceStub }
      ],
      imports: [GameInterfaceComponent, WrapPipeModule]
    })
      .overrideComponent(GameInterfaceComponent, {
        remove: {
          imports: [ModalComponent]
        },
        add: {
          imports: [ModalTestComponent]
        }
      })
      .compileComponents();

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
