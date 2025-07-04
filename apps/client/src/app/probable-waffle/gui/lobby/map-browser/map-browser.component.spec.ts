import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MapBrowserComponent } from "./map-browser.component";
import { CommonModule } from "@angular/common";
import { Component, EventEmitter, input, model, Output } from "@angular/core";
import { SceneCommunicatorClientService } from "../../../communicators/scene-communicator-client.service";
import { AuthService } from "../../../../auth/auth.service";
import { authServiceStub } from "../../../../auth/auth.service.spec";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../../communicators/game-instance-client.service.spec";
import { SceneCommunicatorClientServiceStub } from "../../../communicators/scene-communicator-client.service.spec";
import { ProbableWaffleMapEnum } from "@fuzzy-waddle/api-interfaces";

@Component({
  selector: "probable-waffle-map-browser",
  template: "",
  standalone: true,
  imports: []
})
export class MapBrowserTestingComponent {
  searchQuery = input<string>("");
  selectedMapId = model<ProbableWaffleMapEnum | null>(null);
  @Output() selectedMapIdChange = new EventEmitter<ProbableWaffleMapEnum>();
}

describe("MapBrowserComponent", () => {
  let component: MapBrowserComponent;
  let fixture: ComponentFixture<MapBrowserComponent>;

  beforeEach(async () => {
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
});
