import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HomeComponent } from "./home.component";
import { provideRouter } from "@angular/router";
import { HomePageNavTestingComponent } from "../../../home/page/home-page-nav/home-page-nav.component.spec";
import { BannerComponent } from "./banner/banner.component";
import { BannerTestComponent } from "./banner/banner.component.spec";
import { ModalComponent } from "../../../shared/components/modal/modal.component";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Component } from "@angular/core";
import { HomeBackgroundEffectComponent } from "./home-background-effect/home-background-effect.component";

@Component({
  selector: "probable-waffle-home-background-effect",
  template: "",
  standalone: true
})
class HomeBackgroundEffectTestComponent {}

describe("HomeComponent", () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([]), NgbModal]
    })
      .overrideComponent(HomeComponent, {
        remove: {
          imports: [HomeBackgroundEffectComponent, BannerComponent]
        },
        add: {
          imports: [HomePageNavTestingComponent, HomeBackgroundEffectTestComponent, BannerTestComponent]
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

  it("should have mobile warning config", () => {
    expect(component["mobileWarningConfig"]).toBeDefined();
    expect(component["mobileWarningConfig"].modalTitle).toBe("Desktop Recommended");
  });

  it("should store dismissal in sessionStorage when modal is closed", () => {
    const config = component["mobileWarningConfig"];
    sessionStorage.clear();

    config.onClose?.();

    expect(sessionStorage.getItem("aota_mobile_warning_dismissed")).toBe("true");
  });
});
