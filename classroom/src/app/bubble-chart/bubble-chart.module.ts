import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
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
