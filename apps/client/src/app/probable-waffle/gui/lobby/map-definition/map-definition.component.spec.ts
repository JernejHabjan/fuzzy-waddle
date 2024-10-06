import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MapDefinitionComponent } from "./map-definition.component";
import { FormsModule } from "@angular/forms";
import { Component } from "@angular/core";
import { MapSelectorTestingComponent } from "../map-selector/map-selector.component.spec";
import { TriggerTestingComponent } from "../trigger/trigger.component.spec";
import { TriggerComponent } from "../trigger/trigger.component";
import { MapSelectorComponent } from "../map-selector/map-selector.component";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../../communicators/game-instance-client.service.spec";
import { SceneCommunicatorClientService } from "../../../communicators/scene-communicator-client.service";
import { sceneCommunicatorClientServiceStub } from "../../../../fly-squasher/main/scene-communicator-client.service.spec";

@Component({ selector: "probable-waffle-map-definition", template: "", standalone: true, imports: [] })
export class MapDefinitionTestingComponent {}

describe("MapDefinitionComponent", () => {
  let component: MapDefinitionComponent;
  let fixture: ComponentFixture<MapDefinitionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapDefinitionComponent, FormsModule],
      providers: [
        { provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub },
        { provide: SceneCommunicatorClientService, useValue: sceneCommunicatorClientServiceStub }
      ]
    })
      .overrideComponent(MapDefinitionComponent, {
        remove: {
          imports: [MapSelectorComponent, TriggerComponent]
        },
        add: {
          imports: [MapSelectorTestingComponent, TriggerTestingComponent]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(MapDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
