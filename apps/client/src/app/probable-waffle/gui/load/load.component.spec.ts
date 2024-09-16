import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoadComponent } from "./load.component";
import { gameInstanceLocalStorageServiceStub } from "../../communicators/storage/game-instance-local-storage.service.spec";
import { GameInstanceStorageServiceInterface } from "../../communicators/storage/game-instance-storage.service.interface";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../communicators/game-instance-client.service.spec";
import { provideRouter } from "@angular/router";

describe("LoadComponent", () => {
  let component: LoadComponent;
  let fixture: ComponentFixture<LoadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub },
        { provide: GameInstanceStorageServiceInterface, useValue: gameInstanceLocalStorageServiceStub }
      ],
      imports: [LoadComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LoadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
