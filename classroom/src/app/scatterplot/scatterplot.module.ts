import { NgModule } from '@angular/core';

import { ScatterplotRoutingModule } from './scatterplot-routing.module';
import { ScatterplotComponent } from './scatterplot.component';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { CategorySelectModule } from '../category-select/category-select.module';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { CommonModule } from '@angular/common';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';

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
