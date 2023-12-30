import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TriggerComponent } from "./trigger.component";
import { RouterTestingModule } from "@angular/router/testing";
import { Component } from "@angular/core";
import { MapPlayerDefinitionsService } from "../map-player-definitions.service";
import { mapPlayerDefinitionsServiceStub } from "../map-player-definitions.service.spec";

@Component({ selector: "probable-waffle-trigger", template: "" })
export class TriggerTestingComponent {}

describe("TriggerComponent", () => {
  let component: TriggerComponent;
  let fixture: ComponentFixture<TriggerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: MapPlayerDefinitionsService, useValue: mapPlayerDefinitionsServiceStub }],
      declarations: [TriggerComponent],
      imports: [RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TriggerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
