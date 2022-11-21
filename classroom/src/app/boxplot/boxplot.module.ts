import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { BoxplotRoutingModule } from './boxplot-routing.module';
import { BoxplotComponent } from './boxplot.component';

@NgModule({
  declarations: [BoxplotComponent],
  imports: [
    BoxplotRoutingModule,
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTreeModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  exports: [CommonModule, BoxplotComponent],
})
export class BoxplotModule {}
