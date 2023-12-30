import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MapSelectorComponent } from "./map-selector.component";
import { FormsModule } from "@angular/forms";
import { Component } from "@angular/core";
import { MapPlayerDefinitionsService } from "../map-player-definitions.service";
import { mapPlayerDefinitionsServiceStub } from "../map-player-definitions.service.spec";

@Component({ selector: "probable-waffle-map-selector", template: "" })
export class MapSelectorTestingComponent {}

describe("MapSelectorComponent", () => {
  let component: MapSelectorComponent;
  let fixture: ComponentFixture<MapSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: MapPlayerDefinitionsService, useValue: mapPlayerDefinitionsServiceStub }],
      declarations: [MapSelectorComponent],
      imports: [FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(MapSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
