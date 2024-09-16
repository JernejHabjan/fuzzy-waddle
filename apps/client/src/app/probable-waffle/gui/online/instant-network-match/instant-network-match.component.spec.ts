import { ComponentFixture, TestBed } from "@angular/core/testing";
import { InstantNetworkMatchComponent } from "./instant-network-match.component";
import { matchmakingServiceStub } from "../matchmaking/matchmaking.service.spec";
import { MatchmakingService } from "../matchmaking/matchmaking.service";

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
