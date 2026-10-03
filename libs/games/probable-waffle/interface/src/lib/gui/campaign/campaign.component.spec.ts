import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CampaignComponent } from "./campaign.component";
import { provideRouter } from "@angular/router";
import { HomeNavTestingComponent } from "@fuzzy-waddle/platform-identity/client/home-nav/home-nav.component.spec";
import { HomeNavComponent } from "@fuzzy-waddle/platform-identity/client/home-nav/home-nav.component";
import { provideHttpClient } from "@angular/common/http";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";
import { authServiceStub } from "@fuzzy-waddle/platform-identity/client/auth/auth.service.stub";

describe("CampaignComponent", () => {
  let component: CampaignComponent;
  let fixture: ComponentFixture<CampaignComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampaignComponent],
      providers: [provideRouter([]), provideHttpClient(), { provide: AuthService, useValue: authServiceStub }]
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
    expect(fixture.nativeElement.textContent).toContain("Profile:");
  });
});
