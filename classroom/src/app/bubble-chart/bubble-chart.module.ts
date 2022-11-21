import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatSortModule } from '@angular/material/sort';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { BubbleChartRoutingModule } from './bubble-chart-routing.module';
import { BubbleChartComponent } from './bubble-chart.component';

@NgModule({
  declarations: [BubbleChartComponent],
  imports: [
    BubbleChartRoutingModule,
    CommonModule,
    MatCardModule,
    MatButtonToggleModule,
    MatInputModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
  ],
  exports: [BubbleChartComponent],
})
export class BubbleChartModule {}
