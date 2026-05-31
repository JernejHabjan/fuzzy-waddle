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

  it("should hide the toggler when there are no actions", () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".navbar-toggler")).toBeNull();
  });

  it("should hide the logo and hint copy when back navigation is enabled", () => {
    fixture.componentRef.setInput("showBack", true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector(".home-nav-logo")).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain("Return to previous hub");
  });
});
