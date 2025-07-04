import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AtlasSpriteComponent } from "./atlas-sprite.component";
import { AtlasService } from "../../atlas/atlas.service";
import { atlasServiceStub } from "../../atlas/atlas.service.spec";

describe("AtlasSpriteComponent", () => {
  let component: AtlasSpriteComponent;
  let fixture: ComponentFixture<AtlasSpriteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtlasSpriteComponent],
      providers: [{ provide: AtlasService, useValue: atlasServiceStub }]
    }).compileComponents();

    fixture = TestBed.createComponent(AtlasSpriteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
