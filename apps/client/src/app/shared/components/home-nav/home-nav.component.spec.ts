import { ComponentFixture, TestBed } from "@angular/core/testing";

import { HomeNavComponent } from "./home-nav.component";
import { Component } from "@angular/core";
import { provideRouter } from "@angular/router";

@Component({ selector: "fuzzy-waddle-home-nav", template: "", standalone: true, imports: [] })
export class HomeNavTestingComponent {}

describe("HomeNavComponent", () => {
  let component: HomeNavComponent;
  let fixture: ComponentFixture<HomeNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeNavComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
