import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SwRefreshComponent } from "./sw-refresh.component";
import { Component } from "@angular/core";
import { SwUpdate } from "@angular/service-worker";
import { CommonModule } from "@angular/common";

@Component({ selector: "fuzzy-waddle-sw-refresh", template: "", standalone: true, imports: [CommonModule] })
export class SwRefreshTestingComponent {}

describe("SwRefreshComponent", () => {
  let component: SwRefreshComponent;
  let fixture: ComponentFixture<SwRefreshComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SwRefreshComponent],
      providers: [
        {
          provide: SwUpdate,
          useValue: {}
        }
      ]
    });
    fixture = TestBed.createComponent(SwRefreshComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
