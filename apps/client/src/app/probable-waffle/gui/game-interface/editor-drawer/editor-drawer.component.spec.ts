import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditorDrawerComponent } from './editor-drawer.component';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SceneCommunicatorService } from '../../../communicators/scene-communicator.service';
import { FormsModule } from '@angular/forms';
import { TileSelectorGroupComponent } from './tile-selector-group/tile-selector-group.component';

describe('EditorDrawerComponent', () => {
  let component: EditorDrawerComponent;
  let fixture: ComponentFixture<EditorDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditorDrawerComponent, TileSelectorGroupComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: 123 }) // todo needs to be changed later
          }
        }
      ],
      imports: [RouterTestingModule, HttpClientTestingModule, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(EditorDrawerComponent);
    component = fixture.componentInstance;
    SceneCommunicatorService.setup();
    fixture.detectChanges();
  });

  afterAll(() => {
    SceneCommunicatorService.unsubscribe();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
