import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SunburstChartComponent } from './sunburst-chart.component';

@NgModule({
  declarations: [SunburstChartComponent],
  imports: [CommonModule],
  exports: [CommonModule, SunburstChartComponent],
})
export class SunburstChartModule {}
