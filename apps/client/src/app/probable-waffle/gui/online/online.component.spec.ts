import { ComponentFixture, TestBed } from "@angular/core/testing";

import { OnlineComponent } from "./online.component";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { provideRouter } from "@angular/router";
import { HomeNavTestingComponent } from "../../../shared/components/home-nav/home-nav.component.spec";
import { MatchmakingTestingComponent } from "./matchmaking/matchmaking.component.spec";
import { ServerHealthService } from "../../../shared/services/server-health.service";
import { serverHealthServiceStub } from "../../../shared/services/server-health.service.spec";
import { LobbiesTestingComponent } from "./lobbies/lobbies.component.spec";
import { HostTestingComponent } from "./host/host.component.spec";

describe("OnlineComponent", () => {
  let component: OnlineComponent;
  let fixture: ComponentFixture<OnlineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        OnlineComponent,
        HomeNavTestingComponent,
        MatchmakingTestingComponent,
        LobbiesTestingComponent,
        HostTestingComponent
      ],
      imports: [NgbModule],
      providers: [
        provideRouter([]),
        {
          provide: ServerHealthService,
          useValue: serverHealthServiceStub
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OnlineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
