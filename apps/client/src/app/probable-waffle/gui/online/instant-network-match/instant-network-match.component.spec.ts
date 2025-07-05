import { ComponentFixture, TestBed } from "@angular/core/testing";
import { InstantNetworkMatchComponent } from "./instant-network-match.component";
import { matchmakingServiceStub } from "../matchmaking/matchmaking.service.stub";
import { MatchmakingService } from "../matchmaking/matchmaking.service";
import { ServerHealthService } from "../../../../shared/services/server-health.service";
import { serverHealthServiceStub } from "../../../../shared/services/server-health.service.stub";

describe("InstantNetworkMatchComponent", () => {
  let component: InstantNetworkMatchComponent;
  let fixture: ComponentFixture<InstantNetworkMatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstantNetworkMatchComponent],
      providers: [
        {
          provide: MatchmakingService,
          useValue: matchmakingServiceStub
        },
        {
          provide: ServerHealthService,
          useValue: serverHealthServiceStub
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InstantNetworkMatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
