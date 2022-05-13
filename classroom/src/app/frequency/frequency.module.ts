import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CategorySelectModule } from '../category-select/category-select.module';
import { FrequencyGraphComponent } from '../frequency-graph/frequency-graph.component';
import { FrequencyRoutingModule } from './frequency-routing.module';
import { FrequencyComponent } from './frequency.component';

@NgModule({
  declarations: [FrequencyComponent, FrequencyGraphComponent],
  imports: [
    CommonModule,
    CategorySelectModule,
    FrequencyRoutingModule,
    MatCardModule,
    MatFormFieldModule,
    MatTableModule,
    MatTooltipModule,
    MatSortModule,
  ],
  exports: [CommonModule, FrequencyComponent],
})
export class FrequencyModule {}
