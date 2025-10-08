import { ComponentFixture, TestBed } from "@angular/core/testing";

import { HomePageComponent } from "./home-page.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { HomePageNavTestingComponent } from "./home-page-nav/home-page-nav.component.spec";
import { provideRouter } from "@angular/router";
import { AuthService } from "../../auth/auth.service";
import { authServiceStub } from "../../auth/auth.service.stub";
import { DbAccessTestService } from "../../data-access/db-access-test/db-access-test.service";
import { dbAccessTestServiceStub } from "../../data-access/db-access-test/db-access-test.service.stub";
import { HomePageNavComponent } from "./home-page-nav/home-page-nav.component";
import { ServerHealthService } from "../../shared/services/server-health.service";
import { serverHealthServiceStub } from "../../shared/services/server-health.service.stub";

describe("HomePageComponent", () => {
  let component: HomePageComponent;
  let fixture: ComponentFixture<HomePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageComponent, FontAwesomeTestingModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceStub },
        { provide: DbAccessTestService, useValue: dbAccessTestServiceStub },
        { provide: ServerHealthService, useValue: serverHealthServiceStub }
      ]
    })
      .overrideComponent(HomePageComponent, {
        remove: {
          imports: [HomePageNavComponent]
        },
        add: {
          imports: [HomePageNavTestingComponent]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(HomePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
