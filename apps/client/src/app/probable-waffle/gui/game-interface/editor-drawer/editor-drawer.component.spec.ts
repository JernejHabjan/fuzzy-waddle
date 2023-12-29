import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditorDrawerComponent } from "./editor-drawer.component";
import { ActivatedRoute, provideRouter } from "@angular/router";
import { of } from "rxjs";
import { SceneCommunicatorService } from "../../../communicators/scene-communicator.service";
import { TileSelectorGroupTestingComponent } from "./tile-selector-group/tile-selector-group.component.spec";
import { AtlasLoaderService } from "./atlas-loader.service";
import { ModalTestComponent } from "../../../../shared/components/modal/modal.component.spec";
import { atlasLoaderServiceStub } from "./atlas-loader.service.spec";
import { Component } from "@angular/core";

@Component({ selector: "probable-waffle-editor-drawer", template: "" })
export class EditorDrawerTestingComponent {}

describe("EditorDrawerComponent", () => {
  let component: EditorDrawerComponent;
  let fixture: ComponentFixture<EditorDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditorDrawerComponent, TileSelectorGroupTestingComponent, ModalTestComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: 123 }) // todo needs to be changed later
          }
        },
        {
          provide: AtlasLoaderService,
          useValue: atlasLoaderServiceStub
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditorDrawerComponent);
    component = fixture.componentInstance;
    SceneCommunicatorService.setup();
    fixture.detectChanges();
  });

  afterAll(() => {
    SceneCommunicatorService.unsubscribe();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
