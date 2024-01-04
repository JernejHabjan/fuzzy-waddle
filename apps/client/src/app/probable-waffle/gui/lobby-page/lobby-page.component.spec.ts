import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LobbyPageComponent } from "./lobby-page.component";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../communicators/game-instance-client.service.spec";
import { LobbyTestingComponent } from "../lobby/lobby.component.spec";

describe("LobbyPageComponent", () => {
  let component: LobbyPageComponent;
  let fixture: ComponentFixture<LobbyPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LobbyTestingComponent],
      providers: [{ provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub }],
      imports: [LobbyPageComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LobbyPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
