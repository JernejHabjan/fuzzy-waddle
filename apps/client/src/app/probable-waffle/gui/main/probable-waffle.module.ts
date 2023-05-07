import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ProbableWaffleRoutingModule } from './probable-waffle-routing.module';
import { ProbableWaffleComponent } from './probable-waffle.component';
import { ProgressComponent } from '../progress/progress.component';
import { SkirmishModule } from '../skirmish/skirmish.module';
import { HomeModule } from '../home/home.module';
import { FormsModule } from '@angular/forms';
import { OnlineModule } from '../online/online.module';
import { EditorComponent } from '../editor/editor.component';
import { CampaignComponent } from '../campaign/campaign.component';
import { OptionsComponent } from '../options/options.component';
import { ComponentsModule } from '../../../shared/components/components.module';

@NgModule({
  declarations: [ProbableWaffleComponent, ProgressComponent, EditorComponent, CampaignComponent, OptionsComponent],
  imports: [
    CommonModule,
    ProbableWaffleRoutingModule,
    SkirmishModule,
    HomeModule,
    FormsModule,
    SkirmishModule,
    OnlineModule,
    ComponentsModule,
    NgOptimizedImage
  ]
})
export class ProbableWaffleModule {}
