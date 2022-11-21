import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatSortModule } from '@angular/material/sort';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
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
