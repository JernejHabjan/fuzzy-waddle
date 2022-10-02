import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditorDrawerComponent } from './editor-drawer.component';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';

describe('EditorDrawerComponent', () => {
  let component: EditorDrawerComponent;
  let fixture: ComponentFixture<EditorDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditorDrawerComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: 123 }) // todo needs to be changed later
          }
        }
      ],
      imports: [RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(EditorDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
