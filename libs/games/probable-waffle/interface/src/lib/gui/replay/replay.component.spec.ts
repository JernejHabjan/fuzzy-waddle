import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReplayComponent } from "./replay.component";
import { GameLengthPipe } from "../../pipes/game-length.pipe";
import { gameInstanceClientServiceStub } from "../../communicators/game-instance-client.service.stub";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { provideRouter } from "@angular/router";
import { GameSaveService } from "../../services/game-save/game-save.service";
import { GameSaveServiceStub } from "../../services/game-save/game-save.service.stub";

describe("ReplayComponent", () => {
  let component: ReplayComponent;
  let fixture: ComponentFixture<ReplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub },
        { provide: GameSaveService, useValue: new GameSaveServiceStub() }
      ],
      imports: [ReplayComponent, GameLengthPipe]
    }).compileComponents();

    fixture = TestBed.createComponent(ReplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
