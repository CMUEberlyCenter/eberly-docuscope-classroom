import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { PatternsTableModule } from '../patterns-table/patterns-table.module';
import { SunburstChartModule } from '../sunburst-chart/sunburst-chart.module';
import { TextViewRoutingModule } from './text-veiw-router.module';
import { TextViewComponent } from './text-view.component';

@NgModule({
  declarations: [TextViewComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatIconModule,
    MatToolbarModule,
    MatTreeModule,
    MatTooltipModule,
    PatternsTableModule,
    SunburstChartModule,
    TextViewRoutingModule,
  ],
  exports: [TextViewComponent],
})
export class TextViewModule {}
