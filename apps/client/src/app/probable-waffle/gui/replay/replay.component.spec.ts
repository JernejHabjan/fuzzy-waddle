import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReplayComponent } from "./replay.component";
import { gameInstanceLocalStorageServiceStub } from "../../communicators/storage/game-instance-local-storage.service.spec";
import { GameInstanceStorageServiceInterface } from "../../communicators/storage/game-instance-storage.service.interface";
import { GameLengthPipe } from "../../../shared/pipes/game-length.pipe";
import { gameInstanceClientServiceStub } from "../../communicators/game-instance-client.service.spec";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { RouterTestingModule } from "@angular/router/testing";

describe("ReplayComponent", () => {
  let component: ReplayComponent;
  let fixture: ComponentFixture<ReplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub },
        { provide: GameInstanceStorageServiceInterface, useValue: gameInstanceLocalStorageServiceStub }
      ],
      imports: [ReplayComponent, GameLengthPipe, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ReplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
