import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MapDefinitionComponent } from "./map-definition.component";
import { FormsModule } from "@angular/forms";
import { Component, Input } from "@angular/core";
import { MapSelectorTestingComponent } from "../map-selector/map-selector.component.spec";
import { MapPlayerDefinition } from "../lobby.component";
import { TriggerTestingComponent } from "../trigger/trigger.component.spec";

@Component({ selector: "fuzzy-waddle-map-definition", template: "" })
export class MapDefinitionTestingComponent {
  @Input({ required: true }) mapPlayerDefinition!: MapPlayerDefinition;
}

describe("MapDefinitionComponent", () => {
  let component: MapDefinitionComponent;
  let fixture: ComponentFixture<MapDefinitionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MapDefinitionComponent, MapSelectorTestingComponent, TriggerTestingComponent],
      imports: [FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(MapDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
