import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CampaignComponent } from './campaign.component';
import { provideRouter } from '@angular/router';
import { HomeNavTestingComponent } from '../../../shared/components/home-nav/home-nav.component.spec';

describe('CampaignComponent', () => {
  let component: CampaignComponent;
  let fixture: ComponentFixture<CampaignComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CampaignComponent, HomeNavTestingComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(CampaignComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
