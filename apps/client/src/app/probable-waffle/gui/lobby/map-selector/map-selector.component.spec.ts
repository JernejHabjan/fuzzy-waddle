import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MapSelectorComponent } from "./map-selector.component";
import { FormsModule } from "@angular/forms";
import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { gameInstanceClientServiceStub } from "../../../communicators/game-instance-client.service.spec";

@Component({ selector: "probable-waffle-map-selector", template: "", standalone: true, imports: [CommonModule] })
export class MapSelectorTestingComponent {}

describe("MapSelectorComponent", () => {
  let component: MapSelectorComponent;
  let fixture: ComponentFixture<MapSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapSelectorComponent, FormsModule],
      providers: [{ provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub }]
    }).compileComponents();

    fixture = TestBed.createComponent(MapSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
