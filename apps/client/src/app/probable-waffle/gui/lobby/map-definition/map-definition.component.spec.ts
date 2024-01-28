import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MapDefinitionComponent } from "./map-definition.component";
import { FormsModule } from "@angular/forms";
import { Component } from "@angular/core";
import { MapSelectorTestingComponent } from "../map-selector/map-selector.component.spec";
import { TriggerTestingComponent } from "../trigger/trigger.component.spec";
import { CommonModule } from "@angular/common";
import { TriggerComponent } from "../trigger/trigger.component";
import { MapSelectorComponent } from "../map-selector/map-selector.component";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../../communicators/game-instance-client.service.spec";

@Component({ selector: "probable-waffle-map-definition", template: "", standalone: true, imports: [CommonModule] })
export class MapDefinitionTestingComponent {}

describe("MapDefinitionComponent", () => {
  let component: MapDefinitionComponent;
  let fixture: ComponentFixture<MapDefinitionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapDefinitionComponent, FormsModule],
      providers: [{ provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub }]
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
