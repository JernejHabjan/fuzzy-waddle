import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TriggerComponent } from "./trigger.component";
import { RouterTestingModule } from "@angular/router/testing";
import { Component } from "@angular/core";

@Component({ selector: "probable-waffle-trigger", template: "" })
export class TriggerTestingComponent {}

describe("TriggerComponent", () => {
  let component: TriggerComponent;
  let fixture: ComponentFixture<TriggerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
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
