import { ComponentFixture, TestBed } from "@angular/core/testing";

import { HomeComponent } from "./home.component";
import { provideRouter } from "@angular/router";
import { ConstellationEffectTestComponent } from "./constellation-effect/constellation-effect.component.spec";
import { HomePageNavTestingComponent } from "../../../home/page/home-page-nav/home-page-nav.component.spec";

describe("HomeComponent", () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomeComponent, ConstellationEffectTestComponent, HomePageNavTestingComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
