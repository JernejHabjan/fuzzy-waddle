import { ComponentFixture, TestBed } from "@angular/core/testing";

import { OptionsComponent } from "./options.component";
import { ActivatedRoute } from "@angular/router";

describe("OptionsComponent", () => {
  let component: OptionsComponent;
  let fixture: ComponentFixture<OptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            // add your mock values here that replicate the ActivatedRoute API
            // snapshot: {
            //   paramMap: {
            //     get(): string {
            //       return '1';  // Mock route parameter
            //     }
            //   }
            // }
          }
        }
      ],
      declarations: [OptionsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(OptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
