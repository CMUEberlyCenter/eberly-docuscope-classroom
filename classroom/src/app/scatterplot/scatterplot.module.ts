import { NgModule } from '@angular/core';

import { ScatterplotRoutingModule } from './scatterplot-routing.module';
import { ScatterplotComponent } from './scatterplot.component';
import { MatInputModule } from '@angular/material/input';
import { CategorySelectModule } from '../category-select/category-select.module';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  declarations: [ScatterplotComponent],
  imports: [
    CategorySelectModule,
    CommonModule,
    MatCardModule,
    MatInputModule,
    MatTooltipModule,
    ScatterplotRoutingModule,
  ],
})
export class ScatterplotModule {}
