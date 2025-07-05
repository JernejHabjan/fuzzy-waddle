import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";

import { LittleMuncherComponent } from "./little-muncher.component";
import { SpectateService } from "./home/spectate/spectate.service";
import { spectateServiceStub } from "./home/spectate/spectate.service.stub";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { GameInstanceClientService } from "./main/communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "./main/communicators/game-instance-client.service.stub";
import { MainComponent } from "./main/main.component";
import { HomeComponent } from "./home/home.component";
import { MainTestingComponent } from "./main/main.component.spec";
import { HomeTestingComponent } from "./home/home.component.spec";
import { UserInstanceService } from "../home/profile/user-instance.service";
import { userInstanceServiceStub } from "../home/profile/user-instance.service.stub";

jest.mock("./game/const/game-config", () => ({
  littleMuncherGameConfig: {}
}));

describe("LittleMuncherComponent", () => {
  let component: LittleMuncherComponent;
  let fixture: ComponentFixture<LittleMuncherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LittleMuncherComponent, FontAwesomeTestingModule],
      providers: [
        { provide: UserInstanceService, useValue: userInstanceServiceStub },
        { provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub },
        { provide: SpectateService, useValue: spectateServiceStub },
        { provide: ActivatedRoute, useValue: {} }
      ]
    })
      .overrideComponent(LittleMuncherComponent, {
        remove: {
          imports: [MainComponent, HomeComponent]
        },
        add: {
          imports: [MainTestingComponent, HomeTestingComponent]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(LittleMuncherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
