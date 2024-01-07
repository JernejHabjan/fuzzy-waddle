import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReplayComponent } from "./replay.component";
import { GameInstanceClientService } from "../../../little-muncher/main/communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../../little-muncher/main/communicators/game-instance-client.service.spec";
import { GameInstanceStorageService } from "../../communicators/storage/game-instance-storage.service";
import { gameInstanceStorageServiceStub } from "../../communicators/storage/game-instance-storage.service.spec";

describe("ReplayComponent", () => {
  let component: ReplayComponent;
  let fixture: ComponentFixture<ReplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub },
        { provide: GameInstanceStorageService, useValue: gameInstanceStorageServiceStub }
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
