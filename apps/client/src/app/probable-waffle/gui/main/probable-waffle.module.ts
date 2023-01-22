import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProbableWaffleRoutingModule } from './probable-waffle-routing.module';
import { ProbableWaffleComponent } from './probable-waffle.component';
import { ProfileComponent } from '../profile/profile.component';
import { SkirmishModule } from '../skirmish/skirmish.module';
import { HomeModule } from '../home/home.module';

@NgModule({
  declarations: [ProbableWaffleComponent, ProfileComponent],
  imports: [CommonModule, ProbableWaffleRoutingModule, SkirmishModule, HomeModule]
})
export class ProbableWaffleModule {}
