import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HomeComponent } from "./home.component";
import { provideRouter } from "@angular/router";
import { ConstellationEffectTestComponent } from "./constellation-effect/constellation-effect.component.spec";
import { HomePageNavTestingComponent } from "../../../home/page/home-page-nav/home-page-nav.component.spec";
import { ConstellationEffectComponent } from "./constellation-effect/constellation-effect.component";
import { HomePageNavComponent } from "./home-page-nav/home-page-nav.component";

describe("HomeComponent", () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([])]
    })
      .overrideComponent(HomeComponent, {
        remove: {
          imports: [HomePageNavComponent, ConstellationEffectComponent]
        },
        add: {
          imports: [HomePageNavTestingComponent, ConstellationEffectTestComponent]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
