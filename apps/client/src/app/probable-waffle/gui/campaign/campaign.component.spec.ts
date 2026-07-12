import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CampaignComponent } from "./campaign.component";
import { provideRouter } from "@angular/router";
import { HomeNavTestingComponent } from "../../../shared/components/home-nav/home-nav.component.spec";
import { HomeNavComponent } from "../../../shared/components/home-nav/home-nav.component";
import { provideHttpClient } from "@angular/common/http";
import { AuthService } from "../../../auth/auth.service";

describe("CampaignComponent", () => {
  let component: CampaignComponent;
  let fixture: ComponentFixture<CampaignComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampaignComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: AuthService, useValue: { isAuthenticated: false } }
      ]
    })
      .overrideComponent(CampaignComponent, {
        remove: {
          imports: [HomeNavComponent]
        },
        add: {
          imports: [HomeNavTestingComponent]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(CampaignComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("renders the full campaign roadmap", () => {
    expect(fixture.nativeElement.querySelectorAll("fuzzy-waddle-campaign-chapter-card").length).toBe(5);
  });
});
