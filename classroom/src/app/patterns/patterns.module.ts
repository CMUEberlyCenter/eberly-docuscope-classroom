import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { PatternsTableModule } from '../patterns-table/patterns-table.module';
import { SunburstChartModule } from '../sunburst-chart/sunburst-chart.module';
import { PatternsRoutingModule } from './patterns-router.module';
import { PatternsComponent } from './patterns.component';

@NgModule({
  declarations: [PatternsComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTreeModule,
    MatTooltipModule,
    PatternsRoutingModule,
    PatternsTableModule,
    SunburstChartModule,
  ],
  exports: [CommonModule, PatternsComponent],
})
export class PatternsModule {}
