import { ComponentFixture, TestBed } from "@angular/core/testing";

import { HomePageNavComponent } from "./home-page-nav.component";
import { provideRouter } from "@angular/router";
import { HomeNavTestingComponent } from "../../../../shared/components/home-nav/home-nav.component.spec";

describe("HomePageNavComponent", () => {
  let component: HomePageNavComponent;
  let fixture: ComponentFixture<HomePageNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomePageNavComponent, HomeNavTestingComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(HomePageNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
