import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
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
