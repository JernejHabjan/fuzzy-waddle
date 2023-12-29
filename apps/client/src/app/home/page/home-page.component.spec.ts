import { ComponentFixture, TestBed } from "@angular/core/testing";

import { HomePageComponent } from "./home-page.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { HomePageNavTestingComponent } from "./home-page-nav/home-page-nav.component.spec";
import { provideRouter } from "@angular/router";
import { RouterTestingModule } from "@angular/router/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { AuthService } from "../../auth/auth.service";
import { authServiceStub } from "../../auth/auth.service.spec";
import { DbAccessTestService } from "../../data-access/db-access-test/db-access-test.service";
import { dbAccessTestServiceStub } from "../../data-access/db-access-test/db-access-test.service.spec";

describe("HomePageComponent", () => {
  let component: HomePageComponent;
  let fixture: ComponentFixture<HomePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomePageComponent, HomePageNavTestingComponent],
      imports: [
        FontAwesomeTestingModule,
        RouterTestingModule,
        HttpClientTestingModule // todo remove httpClient from view!
      ],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceStub },
        { provide: DbAccessTestService, useValue: dbAccessTestServiceStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
