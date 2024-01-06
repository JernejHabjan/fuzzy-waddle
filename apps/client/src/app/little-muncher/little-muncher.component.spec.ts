import { ComponentFixture, TestBed } from "@angular/core/testing";

import { LittleMuncherComponent } from "./little-muncher.component";
import { SpectateService } from "./home/spectate/spectate.service";
import { spectateServiceStub } from "./home/spectate/spectate.service.spec";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { GameInstanceClientService } from "./main/communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "./main/communicators/game-instance-client.service.spec";

describe("LittleMuncherComponent", () => {
  let component: LittleMuncherComponent;
  let fixture: ComponentFixture<LittleMuncherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LittleMuncherComponent, FontAwesomeTestingModule],
      providers: [
        { provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub },
        { provide: SpectateService, useValue: spectateServiceStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LittleMuncherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
