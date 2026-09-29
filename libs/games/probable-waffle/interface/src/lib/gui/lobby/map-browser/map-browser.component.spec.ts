import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MapBrowserComponent } from "./map-browser.component";
import { CommonModule } from "@angular/common";
import { Component, input, model, output } from "@angular/core";
import { SceneCommunicatorClientService } from "../../../communicators/scene-communicator-client.service";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";
import { authServiceStub } from "@fuzzy-waddle/platform-identity/client/auth/auth.service.stub";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../../communicators/game-instance-client.service.stub";
import { SceneCommunicatorClientServiceStub } from "../../../communicators/scene-communicator-client.service.stub";
import { ProbableWaffleMapEnum } from "@fuzzy-waddle/probable-waffle-protocol";
import { environment } from "@fuzzy-waddle/environments/environment";

@Component({
  selector: "probable-waffle-map-browser",
  template: "",
  standalone: true,
  imports: []
})
export class MapBrowserTestingComponent {
  searchQuery = input<string>("");
  selectedMapId = model<ProbableWaffleMapEnum | null>(null);
  readonly selectedMapIdChange = output<ProbableWaffleMapEnum>();
}

describe("MapBrowserComponent", () => {
  let component: MapBrowserComponent;
  let fixture: ComponentFixture<MapBrowserComponent>;

  beforeEach(async () => {
    window.sessionStorage.removeItem("fuzzy-waddle:ai-runtime-browser-test-v1");
    await TestBed.configureTestingModule({
      imports: [MapBrowserComponent, CommonModule],
      providers: [
        { provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub },
        { provide: SceneCommunicatorClientService, useValue: SceneCommunicatorClientServiceStub },
        { provide: AuthService, useValue: authServiceStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MapBrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("hides the frozen AI map from ordinary skirmish browsing", () => {
    expect(component.maps.some((map) => map.id === ProbableWaffleMapEnum.AiOpenEconomy)).toBe(false);
  });

  it("offers the frozen AI map only to the explicit local runtime-test lobby", () => {
    window.sessionStorage.setItem("fuzzy-waddle:ai-runtime-browser-test-v1", "test");
    component.ngOnInit();
    expect(component.maps.some((map) => map.id === ProbableWaffleMapEnum.AiOpenEconomy)).toBe(!environment.production);
    window.sessionStorage.removeItem("fuzzy-waddle:ai-runtime-browser-test-v1");
  });
});
