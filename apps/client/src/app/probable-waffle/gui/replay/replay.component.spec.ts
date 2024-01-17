import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReplayComponent } from "./replay.component";
import { GameInstanceClientService } from "../../../little-muncher/main/communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../../little-muncher/main/communicators/game-instance-client.service.spec";
import { gameInstanceLocalStorageServiceStub } from "../../communicators/storage/game-instance-local-storage.service.spec";
import { GameInstanceStorageServiceInterface } from "../../communicators/storage/game-instance-storage.service.interface";

describe("ReplayComponent", () => {
  let component: ReplayComponent;
  let fixture: ComponentFixture<ReplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub },
        { provide: GameInstanceStorageServiceInterface, useValue: gameInstanceLocalStorageServiceStub }
      ],
      imports: [ReplayComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ReplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
